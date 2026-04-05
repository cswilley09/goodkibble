import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeScore } from '@/lib/scoring';

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
  return str.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 120);
}

function estimateAsh(proteinDmb) {
  if (proteinDmb >= 40) return 9;
  if (proteinDmb >= 30) return 8;
  return 7;
}

const FULL_EXTRACT_PROMPT = `You are a dog food product data extractor. Extract the following and return ONLY valid JSON with no other text:
{
  "brand": "string",
  "name": "string (product name without brand prefix)",
  "flavor": "string or null",
  "protein": number (crude protein % from guaranteed analysis, number only),
  "fat": number (crude fat %, number only),
  "fiber": number (crude fiber %, number only),
  "moisture": number (moisture %, number only),
  "ash": number or null (ash % if listed, otherwise null),
  "ingredients": "the COMPLETE ingredient list exactly as shown, as a single string",
  "image_url": "absolute URL of the main product image, or null",
  "primary_protein": "the main animal protein source e.g. Salmon"
}
Important: protein, fat, fiber, moisture MUST be numbers without % signs.`;

const PAGE_ONLY_PROMPT = `You are a dog food product data extractor. Extract from this product page: brand, name, flavor, ingredients (the COMPLETE list exactly as shown), image_url (absolute URL), and primary_protein. Do NOT extract Guaranteed Analysis numbers — ignore any protein/fat/fiber/moisture values. Return ONLY valid JSON with no other text:
{
  "brand": "string",
  "name": "string (product name without brand prefix)",
  "flavor": "string or null",
  "ingredients": "the COMPLETE ingredient list exactly as shown, as a single string",
  "image_url": "absolute URL of the main product image, or null",
  "primary_protein": "the main animal protein source e.g. Salmon"
}`;

const GA_IMAGE_PROMPT = `Read the Guaranteed Analysis from this image of a dog food label or product page. Return ONLY valid JSON with no other text:
{
  "protein": number (crude protein %, number only, no % sign),
  "fat": number (crude fat %, number only),
  "fiber": number (crude fiber %, number only),
  "moisture": number (moisture %, number only),
  "ash": number or null (ash % if listed, otherwise null)
}
Return just the numbers without % signs.`;

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
  if (!jsonMatch) throw new Error('No JSON in Claude response: ' + text.slice(0, 200));
  return JSON.parse(jsonMatch[0]);
}

async function scrapeWithFirecrawl(url) {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }
  const FirecrawlApp = (await import('@mendable/firecrawl-js')).default;
  const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
  const result = await firecrawl.scrapeUrl(url, { formats: ['markdown'] });
  if (!result.success) throw new Error(`Firecrawl failed: ${result.error || 'Unknown error'}`);
  const markdown = result.markdown || result.data?.markdown || '';
  if (!markdown || markdown.length < 50) throw new Error('Firecrawl returned empty or very short content');
  return markdown.slice(0, 50000);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, admin_secret, image_base64, image_type, save = false } = body;

    // Auth
    const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
    if (admin_secret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    if (!url && !image_base64) {
      return NextResponse.json({ error: 'Provide a URL, an image, or both.' }, { status: 400 });
    }

    let extracted;

    // ═══ COMBO MODE: URL + Image ═══
    if (url && image_base64) {
      // Step 1: Scrape URL for page data (brand, name, ingredients, image_url)
      const markdown = await scrapeWithFirecrawl(url);
      const pageData = await callClaude([{
        role: 'user',
        content: `${PAGE_ONLY_PROMPT}\n\nProduct page content:\n${markdown}`,
      }]);

      // Step 2: Read GA from the image
      const gaData = await callClaude([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image_type || 'image/png', data: image_base64 } },
          { type: 'text', text: GA_IMAGE_PROMPT },
        ],
      }]);

      // Merge
      extracted = { ...pageData, ...gaData };
    }

    // ═══ URL ONLY ═══
    else if (url) {
      const markdown = await scrapeWithFirecrawl(url);
      extracted = await callClaude([{
        role: 'user',
        content: `${FULL_EXTRACT_PROMPT}\n\nProduct page content:\n${markdown}`,
      }]);
    }

    // ═══ IMAGE ONLY ═══
    else {
      extracted = await callClaude([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: image_type || 'image/png', data: image_base64 } },
          { type: 'text', text: `Extract dog food product data from this image of a product page or label.\n\n${FULL_EXTRACT_PROMPT}` },
        ],
      }]);
    }

    // ═══ VALIDATE & CALCULATE ═══
    if (extracted.protein == null || extracted.fat == null || extracted.fiber == null || extracted.moisture == null) {
      return NextResponse.json({
        error: 'Could not extract all guaranteed analysis values. Try uploading a clearer screenshot of the GA section.',
        extracted,
      }, { status: 422 });
    }

    const moisture = Number(extracted.moisture) || 10;
    const dryMatter = 100 - moisture;
    const protein_dmb = Math.round((Number(extracted.protein) / dryMatter) * 1000) / 10;
    const fat_dmb = Math.round((Number(extracted.fat) / dryMatter) * 1000) / 10;
    const fiber_dmb = Math.round((Number(extracted.fiber || 0) / dryMatter) * 1000) / 10;

    const ash = extracted.ash != null ? Number(extracted.ash) : estimateAsh(protein_dmb);
    const ash_dmb = Math.round((ash / dryMatter) * 1000) / 10;
    const carbs_dmb = Math.round((100 - protein_dmb - fat_dmb - fiber_dmb - ash_dmb) * 10) / 10;

    const scoreResult = computeScore({
      protein_dmb, fat_dmb, fiber_dmb, carbs_dmb,
      ingredients: extracted.ingredients,
    });

    const slug = slugify(extracted.name);
    const brand_slug = slugify(extracted.brand);

    const product = {
      name: extracted.name,
      brand: extracted.brand,
      brand_slug,
      slug,
      flavor: extracted.flavor || null,
      url: url || null,
      image_url: extracted.image_url || null,
      primary_protein: extracted.primary_protein || null,
      protein: Number(extracted.protein),
      fat: Number(extracted.fat),
      fiber: Number(extracted.fiber || 0),
      moisture, ash,
      ingredients: extracted.ingredients,
      quality_score: scoreResult.total,
      score_breakdown: scoreResult,
      score_version: '1.4',
      scored_at: new Date().toISOString(),
    };

    const fullProduct = { ...product, protein_dmb, fat_dmb, fiber_dmb, carbs_dmb };

    // If save=false, return extracted data for review without inserting
    if (!save) {
      return NextResponse.json({
        success: true,
        saved: false,
        product: fullProduct,
        score: scoreResult,
      });
    }

    // Check for existing
    const supabase = getSupabase();
    const { data: existing } = await supabase
      .from('dog_foods_v2')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'This product already exists in the database',
        product: fullProduct,
        score: scoreResult,
      }, { status: 409 });
    }

    // Insert (exclude DMB columns — they're generated)
    const { data: inserted, error: dbError } = await supabase
      .from('dog_foods_v2')
      .insert(product)
      .select('*')
      .single();

    if (dbError) {
      return NextResponse.json({
        success: false, error: `Database: ${dbError.message}`,
        product: fullProduct, score: scoreResult,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      product: inserted || fullProduct,
      score: scoreResult,
    });

  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
