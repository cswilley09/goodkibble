import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function extractBrandFromTitle(title) {
  if (!title) return null;
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

/* ── Fetch + extract readable text from an article URL ── */
async function fetchArticleText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    // Remove noise
    $('script, style, nav, header, footer, .breadcrumb, .sidebar, #sidebar, .menu, .navigation, .ad, .ads, .social-share, .comments').remove();
    // Target main content
    const main = $('article, main, .article-body, .entry-content, .post-content, .story-body, [role="main"]').first();
    const text = (main.length ? main : $('body')).text();
    return text.replace(/\s+/g, ' ').trim().slice(0, 8000);
  } catch (err) {
    console.error(`[news-enrich] Failed to fetch ${url}:`, err.message);
    return null;
  }
}

/* ── AI enrichment: extract structured recall data from article text ── */
async function enrichFromArticle(articleText, title) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are extracting structured pet food recall information from a news article. Read the text below and extract the following fields. Return ONLY valid JSON, no markdown.

ARTICLE TITLE: ${title}

ARTICLE TEXT:
${articleText}

Extract this JSON:
{
  "brand_name": "The actual company/brand name manufacturing the recalled food. Use the official brand name, not the parent company unless the brand is unknown.",
  "product_description": "A clean, concise description of what was recalled. e.g. 'Young Again Core Health Dog Food, Medium-Large Dog & Puppy Formula (10 lb and 25 lb bags)'",
  "affected_products": "Specific product names, sizes, and variants affected. List each one.",
  "lot_numbers": "All lot numbers, UPC codes, and best-by dates mentioned. Include everything a consumer would need to check their bag.",
  "reason_summary": "2-3 sentence plain English explanation of why this recall happened and what the health risk is. Write for a dog owner, not a regulator.",
  "consumer_action": "What should a dog owner do if they have this food? Be specific — stop feeding, throw away or return, contact vet if symptoms, etc.",
  "distribution_pattern": "Where was this product sold? States, retailers, online.",
  "severity_assessment": "One of: critical, serious, moderate, low. Critical = immediate health danger (Salmonella, foreign objects, toxic levels). Serious = potential health risk. Moderate = quality issue. Low = labeling/packaging issue.",
  "company_contact": "Company phone number or website for consumer inquiries, if mentioned.",
  "recall_date": "The date the recall was initiated or announced, in YYYY-MM-DD format. null if not mentioned."
}

Rules:
- If a field has no data in the article, use null (not empty string)
- Be concise but complete
- For brand_name, use the pet food brand name consumers would recognize, not the manufacturer/parent company
- For lot_numbers, include ALL codes, UPCs, best-by dates mentioned`
      }],
    });

    const text = response.content[0].text.trim();
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('[news-enrich] AI extraction failed:', err.message);
    return null;
  }
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

      // ── Step 1: Fetch and analyze the article with AI ──
      let enriched = null;
      if (item.source_url) {
        const articleText = await fetchArticleText(item.source_url);
        if (articleText && articleText.length > 100) {
          enriched = await enrichFromArticle(articleText, item.title);
        }
      }

      // ── Step 2: Build recall row with AI data (or fallback to basic extraction) ──
      const recallNumber = `NEWS-${item.id}`;
      const brand = enriched?.brand_name || extractBrandFromTitle(item.title);
      const sevMap = { critical: 'Class I', serious: 'Class I', moderate: 'Class II', low: 'Class III' };

      const recallRow = {
        recall_number: recallNumber,
        brand_name: brand,
        brand_name_raw: item.source_name,
        product_description: enriched?.product_description || item.title,
        reason: enriched?.reason_summary || 'Identified via news monitoring — review source for details',
        severity: enriched?.severity_assessment ? (sevMap[enriched.severity_assessment.toLowerCase()] || null) : null,
        status: 'Ongoing',
        recall_date: enriched?.recall_date || (item.pub_date ? new Date(item.pub_date).toISOString().slice(0, 10) : null),
        report_date: item.pub_date ? new Date(item.pub_date).toISOString().slice(0, 10) : null,
        source: 'google_news',
        source_url: item.source_url,
        distribution_pattern: enriched?.distribution_pattern || null,
        lot_numbers: enriched?.lot_numbers || null,
        // AI-enriched fields
        detail_summary: enriched?.reason_summary || null,
        affected_products: enriched?.affected_products || null,
        consumer_action: enriched?.consumer_action || null,
        company_contact: enriched?.company_contact || null,
      };

      const { data: recall, error: recallErr } = await supabase
        .from('recalls')
        .insert(recallRow)
        .select('id')
        .single();

      if (recallErr) return NextResponse.json({ error: `Recall insert: ${recallErr.message}` }, { status: 500 });

      // Update queue item
      await supabase.from('news_recall_queue').update({
        status: 'approved', reviewed_at: new Date().toISOString(), recall_id: recall.id,
      }).eq('id', id);

      return NextResponse.json({
        success: true,
        recall_id: recall.id,
        enriched: !!enriched,
        brand: recallRow.brand_name,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
