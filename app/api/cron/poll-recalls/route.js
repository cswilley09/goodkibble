import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const PET_KEYWORDS = ['dog food', 'cat food', 'pet food', 'pet treat', 'dog treat', 'puppy', 'kitten', 'canine', 'feline', 'kibble', 'chews'];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function parseDate(raw) {
  if (!raw) return null;
  let cleaned = raw.replace(/^Updated\s+/i, '').trim();
  try {
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch { return null; }
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function extractBrandFromTitle(title) {
  if (!title) return null;
  // Try patterns like "Brand Name Dog Food" or "Brand Name Pet Food" or quoted names
  const patterns = [
    /(?:recalls?|alerts?|advisory)[:\s]+["']?([A-Z][A-Za-z'\-\s]{2,30})(?:\s+(?:dog|cat|pet|puppy|kitten))/i,
    /["']([A-Z][A-Za-z'\-\s]{2,30})["']/,
    /^([A-Z][A-Za-z'\-\s]{2,25})\s+(?:recalls?|issues?|voluntar)/i,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// SOURCE 1: FDA Animal & Veterinary Outbreaks page
async function scrapeFDAOutbreaks() {
  const url = 'https://www.fda.gov/animal-veterinary/news-events/outbreaks-and-advisories';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`FDA outbreaks page: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const results = [];
    $('p').each((_, el) => {
      const $el = $(el);
      const $a = $el.find('a[href*="/animal-veterinary/outbreaks-and-advisories/"]');
      if ($a.length === 0) return;

      const text = $el.text().trim();
      const title = $a.first().text().trim();
      let href = $a.first().attr('href') || '';
      if (href.startsWith('/')) href = 'https://www.fda.gov' + href;

      // Extract date: everything before " - " or " – "
      const dashIdx = text.search(/\s[-–]\s/);
      const dateText = dashIdx > 0 ? text.slice(0, dashIdx).trim() : null;

      // Generate recall_number from URL
      const pathSegments = href.replace(/\/$/, '').split('/');
      const lastSegment = pathSegments[pathSegments.length - 1] || slugify(title);
      const recallNumber = 'FDA-AV-' + lastSegment;

      results.push({
        recall_number: recallNumber,
        brand_name: extractBrandFromTitle(title),
        brand_name_raw: null,
        product_description: title,
        reason: title,
        severity: 'Class I',
        status: 'Ongoing',
        recall_date: parseDate(dateText),
        report_date: parseDate(dateText),
        source: 'fda_outbreaks',
        source_url: href,
        distribution_pattern: null,
        lot_numbers: null,
      });
    });

    console.log(`[poll-recalls] FDA Outbreaks page: found ${results.length} advisories`);
    return results;
  } catch (err) {
    console.error('[poll-recalls] FDA Outbreaks scrape error:', err.message);
    return [];
  }
}

// SOURCE 2: FDA Safety Alerts RSS feed
async function scrapeFDARSS() {
  const url = 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/recalls/rss.xml';
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`FDA RSS: ${res.status}`);
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const results = [];
    $('item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('title').text().trim();
      const link = $el.find('link').text().trim();
      const description = $el.find('description').text().trim();
      const pubDate = $el.find('pubDate').text().trim();
      const combined = (title + ' ' + description).toLowerCase();

      // Filter for pet food keywords
      const isPetRelated = PET_KEYWORDS.some(kw => combined.includes(kw));
      if (!isPetRelated) return;

      const recallNumber = 'FDA-RSS-' + slugify(title);

      results.push({
        recall_number: recallNumber,
        brand_name: extractBrandFromTitle(title),
        brand_name_raw: null,
        product_description: title,
        reason: description || title,
        severity: null,
        status: 'Announced',
        recall_date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
        report_date: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
        source: 'fda_rss',
        source_url: link,
        distribution_pattern: null,
        lot_numbers: null,
      });
    });

    console.log(`[poll-recalls] FDA RSS: found ${results.length} pet-related recalls`);
    return results;
  } catch (err) {
    console.error('[poll-recalls] FDA RSS scrape error:', err.message);
    return [];
  }
}

export async function GET(request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  let logId = null;

  try {
    // Log start
    const { data: logRow } = await supabase
      .from('cron_log')
      .insert({ job_name: 'poll-recalls', status: 'started', started_at: startedAt })
      .select('id')
      .single();
    logId = logRow?.id;

    // Load brand mappings
    const { data: brandMap } = await supabase
      .from('brand_name_map')
      .select('external_name, internal_brand_name');

    // Scrape both sources in parallel
    const [source1Results, source2Results] = await Promise.all([
      scrapeFDAOutbreaks(),
      scrapeFDARSS(),
    ]);

    const allResults = [...source1Results, ...source2Results];
    console.log(`[poll-recalls] Total from both sources: ${allResults.length}`);

    if (allResults.length === 0) {
      if (logId) await supabase.from('cron_log').update({
        status: 'completed', records_found: 0, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ success: true, source1Count: 0, source2Count: 0, newRecalls: 0 });
    }

    // Check for existing recall_numbers
    const recallNumbers = allResults.map(r => r.recall_number).filter(Boolean);
    const { data: existing } = await supabase
      .from('recalls')
      .select('recall_number')
      .in('recall_number', recallNumbers);
    const existingSet = new Set((existing || []).map(r => r.recall_number));

    // Filter to new only
    const newRecalls = allResults.filter(r => r.recall_number && !existingSet.has(r.recall_number));
    console.log(`[poll-recalls] ${newRecalls.length} new recalls to insert`);

    // Normalize brand names
    const rows = newRecalls.map(r => ({
      ...r,
      brand_name: r.brand_name
        ? (brandMap || []).reduce((name, m) => {
            if (name.toLowerCase().includes(m.external_name.toLowerCase())) return m.internal_brand_name;
            return name;
          }, r.brand_name)
        : null,
    }));

    let insertedCount = 0;
    if (rows.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('recalls')
        .insert(rows)
        .select('id, brand_name, recall_number');

      if (insertError) {
        console.error('Recall insert error:', insertError);
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      insertedCount = inserted?.length || 0;
      console.log(`[poll-recalls] Inserted ${insertedCount} recalls`);

      // Cross-reference against user saved foods for alerts
      if (inserted && inserted.length > 0) {
        for (const recall of inserted) {
          if (!recall.brand_name) continue;
          const { data: affectedUsers } = await supabase
            .from('user_saved_foods')
            .select('user_id, user_email')
            .ilike('brand_name', `%${recall.brand_name}%`);

          if (affectedUsers && affectedUsers.length > 0) {
            const alertRows = affectedUsers.map(u => ({
              user_id: u.user_id,
              user_email: u.user_email,
              alert_type: 'recall',
              recall_id: recall.id,
              status: 'pending',
            }));
            const { error: alertError } = await supabase.from('alert_queue').insert(alertRows);
            if (alertError) console.error('Alert queue error:', alertError);
            else console.log(`[poll-recalls] Queued ${alertRows.length} alerts for ${recall.recall_number}`);
          }
        }
      }
    }

    // Log completion
    if (logId) await supabase.from('cron_log').update({
      status: 'completed',
      records_found: allResults.length,
      records_processed: insertedCount,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return NextResponse.json({
      success: true,
      source1Count: source1Results.length,
      source2Count: source2Results.length,
      newRecalls: insertedCount,
    });

  } catch (err) {
    console.error('[poll-recalls] Error:', err.message);
    if (logId) {
      await supabase.from('cron_log').update({
        status: 'failed',
        error_message: err.message,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
