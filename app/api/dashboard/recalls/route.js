import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DOG_KEYWORDS = ['dog', 'canine', 'puppy', 'kibble', 'pet food', 'pet treat', 'dog food', 'dog treat'];
const EXCLUDE_KEYWORDS = ['cat food', 'cat treat', 'feline', 'kitten food', 'bird', 'fish food', 'reptile', 'horse', 'cattle', 'poultry feed', 'chicken feed', 'hog', 'swine', 'livestock'];

function isDogRelated(recall) {
  const text = ((recall.product_description || '') + ' ' + (recall.brand_name || '') + ' ' + (recall.reason || '')).toLowerCase();
  // Exclude clearly non-dog items
  if (EXCLUDE_KEYWORDS.some(k => text.includes(k)) && !DOG_KEYWORDS.some(k => text.includes(k))) return false;
  // Include if it mentions dog/pet keywords OR is from a known pet food source
  if (DOG_KEYWORDS.some(k => text.includes(k))) return true;
  // Include if it mentions "pet" broadly
  if (text.includes('pet')) return true;
  // Include if source is fda_outbreaks (these are always pet-related from that page)
  if (recall.source === 'fda_outbreaks') return true;
  return false;
}

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
  const type = searchParams.get('type') || 'both';

  const supabase = getSupabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  let recalls = [];
  let ingredientChanges = [];

  // Fetch recalls
  if (type === 'recalls' || type === 'both') {
    let query = supabase
      .from('recalls')
      .select('*')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(500);

    if (brand) query = query.ilike('brand_name', `%${brand}%`);

    const { data, error } = await query;
    if (error) console.error('Recalls query error:', error.message);
    // Filter to dog-related only
    recalls = (data || []).filter(isDogRelated);
  }

  // Fetch meaningful ingredient changes (table may not exist yet)
  if (type === 'ingredients' || type === 'both') {
    try {
      let query = supabase
        .from('ingredient_changes')
        .select('*')
        .eq('is_meaningful', true)
        .gte('detected_at', sinceISO)
        .order('detected_at', { ascending: false });

      if (brand) query = query.ilike('brand_name', `%${brand}%`);

      const { data, error } = await query;
      if (!error) ingredientChanges = data || [];
    } catch {}
  }

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

  response.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=300');
  return response;
}
