import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '1126';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test 1: specific columns (this works)
  const { data: d1 } = await supabase
    .from('dog_foods_v2')
    .select('id, score_breakdown')
    .eq('id', id)
    .single();

  // Test 2: select * (like the food API)
  const { data: d2 } = await supabase
    .from('dog_foods_v2')
    .select('*')
    .eq('id', id)
    .single();

  // Test 3: select * with canary filter (exact food API pattern)
  const { data: d3 } = await supabase
    .from('dog_foods_v2')
    .select('*')
    .eq('id', id)
    .or('is_canary.is.null,is_canary.eq.false')
    .single();

  const get = (d) => d?.score_breakdown?.categories?.E_protein_source?.first_animal_protein || 'MISSING';

  return NextResponse.json({
    test1_specific_cols: get(d1),
    test2_select_star: get(d2),
    test3_star_with_canary: get(d3),
  });
}
