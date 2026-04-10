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

/*
  POST /api/admin/rescore
  Re-score all products (or a batch) using the latest scoring algorithm.
  Updates quality_score and score_breakdown in dog_foods_v2.

  Body options:
    - limit: number (default 100, max 1000)
    - offset: number (default 0)
    - id: specific product ID to re-score
*/
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
  if (body.admin_secret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const limit = Math.min(body.limit || 100, 1000);
  const offset = body.offset || 0;
  const specificId = body.id || null;

  const supabase = getSupabase();

  try {
    let query = supabase
      .from('dog_foods_v2')
      .select('id, protein_dmb, fat_dmb, fiber_dmb, carbs_dmb, ingredients')
      .not('ingredients', 'is', null);

    if (specificId) {
      query = query.eq('id', specificId);
    } else {
      query = query.range(offset, offset + limit - 1).order('id');
    }

    const { data: products, error } = await query;
    if (error) throw new Error(`Query failed: ${error.message}`);
    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, message: 'No products to re-score', processed: 0 });
    }

    let updated = 0;
    let failed = 0;

    for (const p of products) {
      try {
        const result = computeScore({
          protein_dmb: p.protein_dmb,
          fat_dmb: p.fat_dmb,
          fiber_dmb: p.fiber_dmb,
          carbs_dmb: p.carbs_dmb,
          ingredients: p.ingredients,
        });

        const { error: updateError } = await supabase
          .from('dog_foods_v2')
          .update({
            quality_score: result.total,
            score_breakdown: result,
            score_version: '1.5',
            scored_at: new Date().toISOString(),
          })
          .eq('id', p.id);

        if (updateError) {
          console.error(`[rescore] Failed to update product ${p.id}:`, updateError.message);
          failed++;
        } else {
          updated++;
        }
      } catch (err) {
        console.error(`[rescore] Error scoring product ${p.id}:`, err.message);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: products.length,
      updated,
      failed,
      offset,
      nextOffset: specificId ? null : offset + products.length,
    });

  } catch (err) {
    console.error('[rescore] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
