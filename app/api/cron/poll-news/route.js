import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/*
  SQL to create the table:
  CREATE TABLE news_recall_queue (
    id serial PRIMARY KEY,
    title text NOT NULL,
    source_name text,
    source_url text,
    pub_date timestamptz,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
    reviewed_at timestamptz,
    recall_id uuid REFERENCES recalls(id),
    created_at timestamptz DEFAULT now(),
    guid text UNIQUE
  );
  CREATE POLICY "Allow public read" ON news_recall_queue FOR SELECT USING (true);
  CREATE POLICY "Allow public insert" ON news_recall_queue FOR INSERT WITH CHECK (true);
  CREATE POLICY "Allow public update" ON news_recall_queue FOR UPDATE USING (true) WITH CHECK (true);
*/

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function stripCDATA(str) {
  return (str || '').replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? stripCDATA(match[1]) : null;
}

function extractAttr(xml, tag, attr) {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractSourceName(itemXml) {
  const match = itemXml.match(/<source[^>]*>([^<]*)<\/source>/i);
  return match ? stripCDATA(match[1]) : null;
}

export async function GET(request) {
  // Auth: accept CRON_SECRET header OR admin_secret query param
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const { searchParams } = new URL(request.url);
  const adminSecret = searchParams.get('admin_secret');
  const expectedAdmin = process.env.ADMIN_SECRET || 'gk_admin_2026';

  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && adminSecret !== expectedAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  let logId = null;

  try {
    const { data: logRow } = await supabase
      .from('cron_log')
      .insert({ job_name: 'news_poll', status: 'started', started_at: startedAt })
      .select('id').single();
    logId = logRow?.id;

    // Fetch Google News RSS
    const rssUrl = 'https://news.google.com/rss/search?q=%22dog+food+recall%22+OR+%22pet+food+recall%22+OR+%22dog+treat+recall%22&hl=en-US&gl=US&ceid=US:en';
    const res = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GoodKibble/1.0)' } });
    if (!res.ok) throw new Error(`Google News RSS: HTTP ${res.status}`);
    const xml = await res.text();

    // Extract items
    const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const minAllowed = new Date('2025-01-01');

    const items = [];
    for (const block of itemBlocks) {
      const title = extractTag(block, 'title');
      const link = extractTag(block, 'link');
      const guid = extractTag(block, 'guid') || link;
      const pubDateStr = extractTag(block, 'pubDate');
      const sourceName = extractSourceName(block);
      const pubDate = pubDateStr ? new Date(pubDateStr) : null;

      if (!title || !guid) continue;
      // Reject items without a pubDate, anything older than 7 days, or anything before the hard floor.
      if (!pubDate || isNaN(pubDate.getTime()) || pubDate < sevenDaysAgo || pubDate < minAllowed) continue;

      items.push({ title, source_url: link, guid, pub_date: pubDate.toISOString(), source_name: sourceName });
    }

    console.log(`[poll-news] Found ${items.length} recent items from Google News`);

    // Dedup: check existing guids
    const guids = items.map(i => i.guid).filter(Boolean);
    let existingGuids = new Set();
    if (guids.length > 0) {
      const { data: existing } = await supabase.from('news_recall_queue').select('guid').in('guid', guids);
      existingGuids = new Set((existing || []).map(r => r.guid));
    }

    const newItems = items.filter(i => !existingGuids.has(i.guid));
    console.log(`[poll-news] ${newItems.length} new items to insert`);

    let insertedCount = 0;
    if (newItems.length > 0) {
      const rows = newItems.map(i => ({
        title: i.title,
        source_name: i.source_name,
        source_url: i.source_url,
        pub_date: i.pub_date,
        guid: i.guid,
        status: 'pending',
      }));
      const { error: insertError } = await supabase.from('news_recall_queue').insert(rows);
      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
      insertedCount = newItems.length;
    }

    if (logId) await supabase.from('cron_log').update({
      status: 'completed', records_found: items.length, records_processed: insertedCount,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return NextResponse.json({ success: true, new_items: insertedCount, skipped: items.length - insertedCount });

  } catch (err) {
    console.error('[poll-news] Error:', err.message);
    if (logId) await supabase.from('cron_log').update({
      status: 'failed', error_message: err.message, completed_at: new Date().toISOString(),
    }).eq('id', logId);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
