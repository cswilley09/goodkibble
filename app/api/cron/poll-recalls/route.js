import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function fdaDateToISO(d) {
  if (!d || d.length !== 8) return null;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
}

function daysAgoFDA(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function fetchFDARecalls() {
  const since = daysAgoFDA(30);
  const terms = ['dog', 'pet', 'canine'];
  const searchParts = terms.map(t => `product_description:"${t}"`).join('+');
  const url = `https://api.fda.gov/food/enforcement.json?search=(${searchParts})+AND+report_date:[${since}+TO+${daysAgoFDA(0)}]&limit=100`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return []; // no results
      throw new Error(`FDA API error: ${res.status}`);
    }
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('FDA fetch error:', err.message);
    return [];
  }
}

function normalizeBrand(raw, brandMap) {
  if (!raw) return raw;
  const lower = raw.toLowerCase().trim();
  for (const mapping of brandMap) {
    if (lower.includes(mapping.external_name.toLowerCase())) {
      return mapping.internal_brand_name;
    }
  }
  // Fallback: capitalize first letters
  return raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
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

    // Fetch FDA recalls
    const fdaResults = await fetchFDARecalls();
    console.log(`[poll-recalls] FDA returned ${fdaResults.length} results`);

    if (fdaResults.length === 0) {
      await supabase.from('cron_log').update({
        status: 'completed', records_found: 0, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ status: 'ok', found: 0, processed: 0 });
    }

    // Get existing recall numbers to skip duplicates
    const recallNumbers = fdaResults.map(r => r.recall_number).filter(Boolean);
    const { data: existing } = await supabase
      .from('recalls')
      .select('recall_number')
      .in('recall_number', recallNumbers);
    const existingSet = new Set((existing || []).map(r => r.recall_number));

    // Filter to new recalls only
    const newRecalls = fdaResults.filter(r => r.recall_number && !existingSet.has(r.recall_number));
    console.log(`[poll-recalls] ${newRecalls.length} new recalls to insert`);

    if (newRecalls.length === 0) {
      await supabase.from('cron_log').update({
        status: 'completed', records_found: fdaResults.length, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ status: 'ok', found: fdaResults.length, processed: 0 });
    }

    // Insert new recalls
    const rows = newRecalls.map(r => ({
      recall_number: r.recall_number,
      brand_name: normalizeBrand(r.recalling_firm, brandMap || []),
      brand_name_raw: r.recalling_firm,
      product_description: r.product_description,
      reason: r.reason_for_recall,
      severity: r.classification,
      status: r.status,
      recall_date: fdaDateToISO(r.recall_initiation_date),
      report_date: fdaDateToISO(r.report_date),
      source: 'openfda_api',
      source_url: `https://api.fda.gov/food/enforcement.json?search=recall_number:"${r.recall_number}"`,
      distribution_pattern: r.distribution_pattern,
      lot_numbers: r.code_info,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('recalls')
      .insert(rows)
      .select('id, brand_name, recall_number');

    if (insertError) {
      console.error('Recall insert error:', insertError);
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log(`[poll-recalls] Inserted ${inserted.length} recalls`);

    // Cross-reference against user saved foods for alerts
    if (inserted && inserted.length > 0) {
      const brands = [...new Set(inserted.map(r => r.brand_name?.toLowerCase()).filter(Boolean))];

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

          const { error: alertError } = await supabase
            .from('alert_queue')
            .insert(alertRows);

          if (alertError) console.error('Alert queue insert error:', alertError);
          else console.log(`[poll-recalls] Queued ${alertRows.length} alerts for recall ${recall.recall_number}`);
        }
      }
    }

    // Log completion
    await supabase.from('cron_log').update({
      status: 'completed',
      records_found: fdaResults.length,
      records_processed: inserted.length,
      completed_at: new Date().toISOString(),
    }).eq('id', logId);

    return NextResponse.json({
      status: 'ok',
      found: fdaResults.length,
      processed: inserted.length,
    });

  } catch (err) {
    console.error('[poll-recalls] Error:', err.message);

    // Log failure
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
