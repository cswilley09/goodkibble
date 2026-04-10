import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function fetchUTF8(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder('utf-8').decode(buf);
}

function extractPageText(html) {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, .breadcrumb, .sidebar, #sidebar, .menu, .navigation').remove();
  const main = $('main, article, .main-content, #content, .content-area, [role="main"]').first();
  const text = (main.length ? main : $('body')).text();
  return text.replace(/\s+/g, ' ').trim().slice(0, 8000);
}

/*
  POST /api/admin/enrich-recalls

  Backfill AI-enriched data on existing recalls.

  Options (JSON body):
    - limit: number (default 10, max 50) — how many recalls to process
    - force: boolean (default false) — re-enrich even if detail_summary exists
    - id: string — enrich a specific recall by ID
*/
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
  if (body.admin_secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const limit = Math.min(body.limit || 10, 50);
  const force = body.force || false;
  const specificId = body.id || null;

  try {
    // Find recalls that need enrichment
    let query = supabase
      .from('recalls')
      .select('id, recall_number, source_url, brand_name, brand_name_raw, product_description, reason, lot_numbers, distribution_pattern, severity, detail_summary')
      .not('source_url', 'is', null)
      .order('created_at', { ascending: false });

    if (specificId) {
      query = query.eq('id', specificId);
    } else if (!force) {
      // Only process recalls missing enrichment data
      query = query.is('detail_summary', null);
    }

    query = query.limit(limit);

    const { data: recalls, error } = await query;
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!recalls || recalls.length === 0) {
      return NextResponse.json({ success: true, message: 'No recalls to enrich', processed: 0 });
    }

    console.log(`[enrich-recalls] Processing ${recalls.length} recalls`);

    const results = [];

    for (const recall of recalls) {
      try {
        if (!recall.source_url) {
          results.push({ id: recall.id, status: 'skipped', reason: 'no source_url' });
          continue;
        }

        // Fetch source page
        let pageText;
        try {
          const html = await fetchUTF8(recall.source_url);
          pageText = extractPageText(html);
        } catch (fetchErr) {
          results.push({ id: recall.id, status: 'failed', reason: `fetch: ${fetchErr.message}` });
          continue;
        }

        if (pageText.length < 50) {
          results.push({ id: recall.id, status: 'skipped', reason: 'page too short' });
          continue;
        }

        // Send to Claude
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `You are extracting structured recall information from an FDA page about a pet food recall. Read the text below and extract the following fields. Return ONLY valid JSON, no markdown.

PAGE TEXT:
${pageText}

EXISTING DATA (may be incomplete or wrong — override with better info from the page):
- Title: ${recall.product_description || ''}
- Brand (current): ${recall.brand_name || 'Unknown'}
- Reason (current): ${recall.reason || ''}

Extract this JSON:
{
  "brand_name": "The actual company/brand name manufacturing the recalled food (e.g. 'Darwin's Natural Pet Products', 'Sunshine Mills'). Use the official name from the page, not FDA advisory title shorthand.",
  "affected_products": "Specific product names, sizes, and variants affected. List each one. e.g. 'Natural Selections Chicken Recipe (5 lb, 15 lb), Grain-Free Turkey Formula (all sizes)'",
  "lot_numbers": "All lot numbers, UPC codes, and best-by dates mentioned. Include everything a consumer would need to check their bag.",
  "reason_summary": "2-3 sentence plain English explanation of why this recall happened and what the health risk is. Write for a dog owner, not a regulator. e.g. 'Routine testing found Salmonella bacteria in multiple production lots. Salmonella can cause illness in dogs including lethargy, diarrhea, and vomiting. It can also spread to humans handling the food.'",
  "consumer_action": "What should a dog owner do if they have this food? Be specific. e.g. 'Stop feeding immediately. Throw away or return to store for refund. If your dog shows symptoms (vomiting, diarrhea, lethargy), contact your vet. Wash hands and surfaces that contacted the food.'",
  "distribution_pattern": "Where was this product sold? States, retailers, online. e.g. 'Sold nationwide at PetSmart, Petco, and Amazon. Also distributed to independent pet stores in 23 states.'",
  "severity_assessment": "One of: critical, serious, moderate, low. Critical = immediate health danger (Salmonella, foreign objects, toxic levels). Serious = potential health risk. Moderate = quality issue. Low = labeling/packaging issue.",
  "company_contact": "Company phone number or website for consumer inquiries, if mentioned."
}

Rules:
- If a field has no data on the page, use null (not empty string)
- Be concise but complete
- Use the actual brand/company name from the page, even if the existing data says something different
- For lot_numbers, include ALL codes, UPCs, best-by dates — this is what consumers check against their bag`
          }],
        });

        const text = response.content[0].text.trim();
        const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
        const data = JSON.parse(jsonStr);

        // Build update
        const update = {};
        if (data.brand_name && data.brand_name !== 'Unknown') update.brand_name = data.brand_name;
        if (data.reason_summary) update.detail_summary = data.reason_summary;
        if (data.affected_products) update.affected_products = data.affected_products;
        if (data.consumer_action) update.consumer_action = data.consumer_action;
        if (data.company_contact) update.company_contact = data.company_contact;
        if (data.lot_numbers) update.lot_numbers = data.lot_numbers;
        if (data.distribution_pattern) update.distribution_pattern = data.distribution_pattern;
        if (data.severity_assessment && !recall.severity) {
          const sevMap = { critical: 'Class I', serious: 'Class I', moderate: 'Class II', low: 'Class III' };
          const mapped = sevMap[data.severity_assessment.toLowerCase()];
          if (mapped) update.severity = mapped;
        }

        if (Object.keys(update).length > 0) {
          const { error: updateError } = await supabase
            .from('recalls')
            .update(update)
            .eq('id', recall.id);

          if (updateError) {
            results.push({ id: recall.id, status: 'failed', reason: `update: ${updateError.message}` });
          } else {
            results.push({ id: recall.id, status: 'enriched', brand: update.brand_name || recall.brand_name, fields: Object.keys(update) });
          }
        } else {
          results.push({ id: recall.id, status: 'skipped', reason: 'no new data extracted' });
        }

      } catch (err) {
        results.push({ id: recall.id, status: 'failed', reason: err.message });
      }
    }

    const enriched = results.filter(r => r.status === 'enriched').length;
    console.log(`[enrich-recalls] Done: ${enriched}/${recalls.length} enriched`);

    return NextResponse.json({
      success: true,
      processed: recalls.length,
      enriched,
      results,
    });

  } catch (err) {
    console.error('[enrich-recalls] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
