import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const brand = searchParams.get('brand');
  const days = parseInt(searchParams.get('days') || '90');
  const type = searchParams.get('type') || 'both'; // 'recalls' | 'ingredients' | 'both'

  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString().slice(0, 10);

  let recalls = [];
  let ingredientChanges = [];

  // Fetch recalls
  if (type === 'recalls' || type === 'both') {
    let query = supabase
      .from('recalls')
      .select('*')
      .gte('report_date', sinceISO)
      .order('report_date', { ascending: false });

    if (brand) query = query.ilike('brand_name', `%${brand}%`);

    const { data, error } = await query;
    if (error) console.error('Recalls query error:', error.message);
    recalls = data || [];
  }

  // Fetch meaningful ingredient changes
  if (type === 'ingredients' || type === 'both') {
    let query = supabase
      .from('ingredient_changes')
      .select('*')
      .eq('is_meaningful', true)
      .gte('detected_at', sinceISO)
      .order('detected_at', { ascending: false });

    if (brand) query = query.ilike('brand_name', `%${brand}%`);

    const { data, error } = await query;
    if (error) console.error('Ingredient changes query error:', error.message);
    ingredientChanges = data || [];
  }

  // Build summary
  const classICt = recalls.filter(r => r.severity === 'Class I').length;
  const classIICt = recalls.filter(r => r.severity === 'Class II').length;

  const response = NextResponse.json({
    recalls,
    ingredientChanges,
    summary: {
      totalRecalls: recalls.length,
      totalIngredientChanges: ingredientChanges.length,
      periodDays: days,
      classIRecalls: classICt,
      classIIRecalls: classIICt,
    },
  });

  response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
  return response;
}
