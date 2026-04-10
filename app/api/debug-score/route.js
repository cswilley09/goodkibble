import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '1126';

  // Fresh client — no singleton, no cache
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('dog_foods_v2')
    .select('id, score_breakdown')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const e = data?.score_breakdown?.categories?.E_protein_source;

  return NextResponse.json({
    id: data?.id,
    has_score_breakdown: !!data?.score_breakdown,
    e_protein_source_keys: e ? Object.keys(e) : null,
    first_animal_protein: e?.first_animal_protein || 'MISSING',
    second_animal_protein: e?.second_animal_protein || 'MISSING',
    raw_e: e,
  });
}
