/*
  ⚠️ TEMPORARY TEST ROUTE — DELETE AFTER TESTING
  This is a copy of /api/cron/poll-recalls with auth removed
  so it can be triggered manually from a browser.
  DO NOT leave this in production.
*/

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
      if (res.status === 404) return [];
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
  return raw.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export async function GET(request) {
  // NO AUTH CHECK — temporary test route

  const supabase = getSupabase();
  const startedAt = new Date().toISOString();
  let logId = null;

  try {
    const { data: logRow } = await supabase
      .from('cron_log')
      .insert({ job_name: 'poll-recalls-test', status: 'started', started_at: startedAt })
      .select('id')
      .single();
    logId = logRow?.id;

    const { data: brandMap } = await supabase
      .from('brand_name_map')
      .select('external_name, internal_brand_name');

    const fdaResults = await fetchFDARecalls();
    console.log(`[test-poll] FDA returned ${fdaResults.length} results`);

    if (fdaResults.length === 0) {
      if (logId) await supabase.from('cron_log').update({
        status: 'completed', records_found: 0, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ status: 'ok', found: 0, processed: 0 });
    }

    const recallNumbers = fdaResults.map(r => r.recall_number).filter(Boolean);
    const { data: existing } = await supabase
      .from('recalls')
      .select('recall_number')
      .in('recall_number', recallNumbers);
    const existingSet = new Set((existing || []).map(r => r.recall_number));

    const newRecalls = fdaResults.filter(r => r.recall_number && !existingSet.has(r.recall_number));
    console.log(`[test-poll] ${newRecalls.length} new recalls to insert`);

    if (newRecalls.length === 0) {
      if (logId) await supabase.from('cron_log').update({
        status: 'completed', records_found: fdaResults.length, records_processed: 0,
        completed_at: new Date().toISOString(),
      }).eq('id', logId);
      return NextResponse.json({ status: 'ok', found: fdaResults.length, processed: 0 });
    }

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

    console.log(`[test-poll] Inserted ${inserted.length} recalls`);

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

          const { error: alertError } = await supabase
            .from('alert_queue')
            .insert(alertRows);

          if (alertError) console.error('Alert queue insert error:', alertError);
          else console.log(`[test-poll] Queued ${alertRows.length} alerts for recall ${recall.recall_number}`);
        }
      }
    }

    if (logId) await supabase.from('cron_log').update({
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
    console.error('[test-poll] Error:', err.message);

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
