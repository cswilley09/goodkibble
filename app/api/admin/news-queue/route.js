import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function extractBrandFromTitle(title) {
  if (!title) return null;
  // Try common patterns: "Brand Name Recalls..." or "Brand Name Dog Food Recalled"
  const patterns = [
    /^([A-Z][A-Za-z'\-\s]{1,30}?)\s+(?:recall|issue|voluntar)/i,
    /^([A-Z][A-Za-z'\-\s]{1,30}?)\s+(?:dog|pet|cat)\s+(?:food|treat)/i,
    /"([^"]{2,30})"/,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

// GET: list queue items
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'pending';
  const supabase = getSupabase();

  let query = supabase.from('news_recall_queue').select('*').order('pub_date', { ascending: false });
  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

// POST: approve or dismiss
export async function POST(request) {
  try {
    const { id, action, admin_secret } = await request.json();
    const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
    if (admin_secret !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    const supabase = getSupabase();

    if (action === 'dismiss') {
      const { error } = await supabase.from('news_recall_queue')
        .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === 'approve') {
      // Get the news item
      const { data: item, error: fetchErr } = await supabase
        .from('news_recall_queue').select('*').eq('id', id).single();
      if (fetchErr || !item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

      // Insert recall
      const recallNumber = `NEWS-${item.id}`;
      const brand = extractBrandFromTitle(item.title);

      const { data: recall, error: recallErr } = await supabase.from('recalls').insert({
        recall_number: recallNumber,
        brand_name: brand,
        brand_name_raw: item.source_name,
        product_description: item.title,
        reason: 'Identified via news monitoring — review source for details',
        severity: null,
        status: 'Ongoing',
        recall_date: item.pub_date ? new Date(item.pub_date).toISOString().slice(0, 10) : null,
        report_date: item.pub_date ? new Date(item.pub_date).toISOString().slice(0, 10) : null,
        source: 'google_news',
        source_url: item.source_url,
        distribution_pattern: null,
        lot_numbers: null,
      }).select('id').single();

      if (recallErr) return NextResponse.json({ error: `Recall insert: ${recallErr.message}` }, { status: 500 });

      // Update queue item
      await supabase.from('news_recall_queue').update({
        status: 'approved', reviewed_at: new Date().toISOString(), recall_id: recall.id,
      }).eq('id', id);

      return NextResponse.json({ success: true, recall_id: recall.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
