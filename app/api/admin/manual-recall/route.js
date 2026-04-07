import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function slugify(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

const EXTRACT_PROMPT = `You are extracting dog food recall information. Return ONLY valid JSON:
{
  "brand_name": "the brand or company name",
  "product_description": "the specific product(s) being recalled",
  "reason": "why it was recalled (e.g. possible Salmonella contamination)",
  "severity": "Class I" or "Class II" or "Class III" or null (if not mentioned),
  "recall_date": "YYYY-MM-DD format, the date the recall was announced or initiated",
  "lot_numbers": "specific lot numbers, UPC codes, or best-by dates affected (or null)",
  "distribution_pattern": "where the product was sold/distributed (or null)",
  "company_name": "the full legal company name if different from brand"
}
Extract as much detail as possible. If a field isn't mentioned, return null.`;

async function callClaude(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} — ${err.slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');
  return JSON.parse(jsonMatch[0]);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { admin_secret, mode, url, pdf_base64, email_text, save = false, recall: directRecall } = body;

    const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
    if (admin_secret !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // MODE: SAVE — direct save of an edited recall object
    if (mode === 'save' && directRecall) {
      const supabase = getSupabase();
      const { data: existing } = await supabase.from('recalls').select('id').eq('recall_number', directRecall.recall_number).maybeSingle();
      if (existing) return NextResponse.json({ success: false, error: 'This recall already exists' }, { status: 409 });
      const { data: inserted, error: dbError } = await supabase.from('recalls').insert(directRecall).select('*').single();
      if (dbError) return NextResponse.json({ success: false, error: `Database: ${dbError.message}` }, { status: 500 });
      return NextResponse.json({ success: true, saved: true, recall: inserted });
    }

    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });

    let extracted;

    // MODE: URL — fetch page content and extract
    if (mode === 'url' && url) {
      let content;
      // Check if URL is a PDF
      if (url.toLowerCase().endsWith('.pdf')) {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error(`Failed to fetch PDF: HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');
        extracted = await callClaude([{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: `Extract recall information from this PDF.\n\n${EXTRACT_PROMPT}` },
          ],
        }]);
      } else {
        // Regular webpage
        let pageText;
        try {
          if (process.env.FIRECRAWL_API_KEY) {
            const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
            const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
            const result = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });
            pageText = result.markdown || result.data?.markdown || '';
          }
        } catch {}
        if (!pageText) {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' } });
          if (!res.ok) throw new Error(`Failed to fetch: HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          pageText = new TextDecoder('utf-8').decode(buf);
        }
        extracted = await callClaude([{
          role: 'user',
          content: `Extract recall information from this page.\n\n${EXTRACT_PROMPT}\n\nPage content:\n${pageText.slice(0, 50000)}`,
        }]);
      }
      extracted._source_url = url;
    }

    // MODE: PDF — base64 uploaded directly
    else if (mode === 'pdf' && pdf_base64) {
      extracted = await callClaude([{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf_base64 } },
          { type: 'text', text: `Extract recall information from this PDF.\n\n${EXTRACT_PROMPT}` },
        ],
      }]);
    }

    // MODE: EMAIL — plain text pasted
    else if (mode === 'email' && email_text) {
      extracted = await callClaude([{
        role: 'user',
        content: `Extract recall information from this email or text.\n\n${EXTRACT_PROMPT}\n\nEmail content:\n${email_text.slice(0, 30000)}`,
      }]);
    }

    else {
      return NextResponse.json({ error: 'Provide url, pdf_base64, or email_text with the appropriate mode' }, { status: 400 });
    }

    // Build recall object
    const dateSlug = extracted.recall_date || new Date().toISOString().slice(0, 10);
    const brandSlug = slugify(extracted.brand_name || 'unknown');
    const recallNumber = `MANUAL-${dateSlug}-${brandSlug}`;

    const recall = {
      recall_number: recallNumber,
      brand_name: extracted.brand_name,
      brand_name_raw: extracted.company_name || extracted.brand_name,
      product_description: extracted.product_description,
      reason: extracted.reason,
      severity: ['Class I', 'Class II', 'Class III'].includes(extracted.severity) ? extracted.severity : null,
      status: 'Ongoing',
      recall_date: extracted.recall_date || null,
      report_date: extracted.recall_date || null,
      source: 'manual',
      source_url: extracted._source_url || url || null,
      distribution_pattern: extracted.distribution_pattern || null,
      lot_numbers: extracted.lot_numbers || null,
    };

    // If save=false, return for review
    if (!save) {
      return NextResponse.json({ success: true, saved: false, recall, extracted });
    }

    // Save to database
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('recalls')
      .select('id')
      .eq('recall_number', recallNumber)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: false, error: 'This recall already exists', recall }, { status: 409 });
    }

    const { data: inserted, error: dbError } = await supabase
      .from('recalls')
      .insert(recall)
      .select('*')
      .single();

    if (dbError) {
      return NextResponse.json({ success: false, error: `Database: ${dbError.message}`, recall }, { status: 500 });
    }

    return NextResponse.json({ success: true, saved: true, recall: inserted });

  } catch (err) {
    console.error('Manual recall error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
