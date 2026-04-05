import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { computeScore } from '@/lib/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/*
  ENV VARS REQUIRED:
  - ADMIN_SECRET (any string you choose for admin auth)
  - ANTHROPIC_API_KEY (from console.anthropic.com)
  - SUPABASE_SERVICE_ROLE_KEY
*/

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

function slugify(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function estimateAsh(proteinDmb) {
  if (proteinDmb >= 40) return 9;
  if (proteinDmb >= 30) return 8;
  return 7;
}

export async function POST(request) {
  // Auth
  const auth = request.headers.get('authorization');
  const adminSecret = process.env.ADMIN_SECRET || 'gk_admin_2026';
  if (auth !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    // 1. Fetch the product page
    const pageRes = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!pageRes.ok) throw new Error(`Failed to fetch page: HTTP ${pageRes.status}`);
    const buf = await pageRes.arrayBuffer();
    const pageText = new TextDecoder('utf-8').decode(buf);

    // Trim to avoid sending too much to Claude (keep first 50k chars)
    const trimmed = pageText.slice(0, 50000);

    // 2. Extract data with Claude
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract dog food product data from this page HTML. Return ONLY valid JSON with no other text:\n\n{\n  "brand": "string",\n  "name": "string (product name without brand prefix)",\n  "flavor": "string or null",\n  "protein": number (crude protein % from guaranteed analysis),\n  "fat": number (crude fat %),\n  "fiber": number (crude fiber %),\n  "moisture": number (moisture %),\n  "ash": number or null (ash % - if not listed return null),\n  "ingredients": "full ingredient list as a single string exactly as shown",\n  "image_url": "absolute URL of the main product image",\n  "primary_protein": "the primary animal protein source e.g. Salmon"\n}\n\nPage content:\n${trimmed}`,
        }],
      }),
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      throw new Error(`Claude API error: ${claudeRes.status} — ${errBody.slice(0, 200)}`);
    }

    const claudeData = await claudeRes.json();
    const rawText = claudeData.content?.[0]?.text || '';

    // Parse JSON from Claude's response (handle markdown code blocks)
    let extracted;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in Claude response');
      extracted = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      return NextResponse.json({
        error: 'Failed to parse Claude response',
        raw: rawText.slice(0, 500),
      }, { status: 422 });
    }

    // 3. Calculate DMB values
    const moisture = extracted.moisture || 10;
    const dryMatter = 100 - moisture;
    const protein_dmb = Math.round((extracted.protein / dryMatter) * 1000) / 10;
    const fat_dmb = Math.round((extracted.fat / dryMatter) * 1000) / 10;
    const fiber_dmb = Math.round(((extracted.fiber || 0) / dryMatter) * 1000) / 10;

    // Ash: use extracted or estimate
    const ash = extracted.ash != null ? extracted.ash : estimateAsh(protein_dmb);
    const ash_dmb = Math.round((ash / dryMatter) * 1000) / 10;
    const carbs_dmb = Math.round((100 - protein_dmb - fat_dmb - fiber_dmb - ash_dmb) * 10) / 10;

    // 4. Score the product
    const scoreResult = computeScore({
      protein_dmb,
      fat_dmb,
      fiber_dmb,
      carbs_dmb,
      ingredients: extracted.ingredients,
    });

    // 5. Build the product row
    const slug = slugify(extracted.name);
    const brand_slug = slugify(extracted.brand);

    const product = {
      name: extracted.name,
      brand: extracted.brand,
      brand_slug,
      slug,
      flavor: extracted.flavor || null,
      url,
      image_url: extracted.image_url || null,
      primary_protein: extracted.primary_protein || null,
      protein_dmb,
      fat_dmb,
      carbs_dmb,
      fiber_dmb,
      moisture,
      ash,
      ingredients: extracted.ingredients,
      quality_score: scoreResult.total,
      score_breakdown: scoreResult,
      score_version: '1.4',
      scored_at: new Date().toISOString(),
    };

    // 6. Insert into database
    const supabase = getSupabase();
    const { data: inserted, error: dbError } = await supabase
      .from('dog_foods_v2')
      .upsert(product, { onConflict: 'slug', ignoreDuplicates: true })
      .select('*')
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      // Return the product data even if insert fails so the admin can see it
      return NextResponse.json({
        success: false,
        error: `Database error: ${dbError.message}`,
        product,
        score: scoreResult,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product: inserted || product,
      score: scoreResult,
    });

  } catch (err) {
    console.error('Scrape error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
