import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Word-boundary match — prevents "corn dog", "hush puppy", "treated" false positives
function wordMatch(text, term) {
  const re = new RegExp(`(^|[\\s,;:(/"-])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s,;:)/".!?-]|$)`, 'i');
  return re.test(text);
}

// These must appear as whole words/phrases in the product text
const DOG_TERMS = [
  'dog food', 'dog treat', 'dog treats', 'dog chew', 'dog chews', 'dog bone', 'dog bones',
  'dog snack', 'dog snacks', 'dog biscuit', 'dog biscuits', 'dog meal',
  'puppy food', 'puppy treat', 'puppy treats', 'puppy chew',
  'pet food', 'pet treat', 'pet treats', 'pet snack',
  'raw dog', 'freeze-dried dog', 'freeze dried dog', 'dehydrated dog',
  'canine', 'kibble',
];
// Broader terms that confirm dog-relatedness (still word-boundary checked)
const DOG_BROAD = ['dog', 'puppy'];
// If any of these appear, it's NOT dog food even if "dog" appears
const FALSE_POSITIVE_PHRASES = [
  'corn dog', 'hot dog', 'chili dog', 'hush puppy', 'hush puppies',
  'puppy chow snack mix', 'slaw dog', 'dog bun', 'hot-dog',
  'human', 'infant formula', 'baby food',
  'chicken feed', 'poultry feed', 'cattle feed', 'hog feed', 'swine feed',
  'livestock', 'horse feed', 'equine',
];

function isDogRelated(recall) {
  const text = ((recall.product_description || '') + ' ' + (recall.brand_name || '') + ' ' + (recall.reason || '')).toLowerCase();

  // Always trust manual and google_news (admin-approved) and fda_outbreaks (pet-specific page)
  if (['manual', 'google_news', 'fda_outbreaks'].includes(recall.source)) return true;

  // Check false-positive phrases first
  if (FALSE_POSITIVE_PHRASES.some(fp => text.includes(fp))) return false;

  // Check specific dog food terms (high confidence)
  if (DOG_TERMS.some(t => wordMatch(text, t))) return true;

  // Check broader terms with word boundary
  if (DOG_BROAD.some(t => wordMatch(text, t))) {
    // "dog" or "puppy" as a standalone word — confirm it's in a food context
    const foodContext = ['food', 'treat', 'chew', 'snack', 'biscuit', 'kibble', 'meal', 'bone', 'diet', 'nutrition', 'raw', 'freeze', 'grain', 'recipe', 'formula', 'supplement'];
    if (foodContext.some(f => text.includes(f))) return true;
    // Also accept if the recalling firm is a known pet company pattern
    const firm = (recall.brand_name_raw || '').toLowerCase();
    if (['pet', 'animal', 'paw', 'bark', 'woof', 'tail'].some(p => firm.includes(p))) return true;
  }

  return false;
}

// Build a real source URL for each recall based on source type and available data
function resolveSourceUrl(recall) {
  const url = recall.source_url;
  const recallNum = recall.recall_number;

  // openFDA enforcement — search the FDA recalls page by recall number
  if (recall.source === 'openfda_enforcement' || (url && url.includes('api.fda.gov/'))) {
    if (recallNum) {
      return `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts?search_api_fulltext=${encodeURIComponent(recallNum)}`;
    }
    return 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts';
  }

  // No URL at all — try to build one from the source type
  if (!url) {
    if (recall.source === 'fda_outbreaks') return 'https://www.fda.gov/animal-veterinary/outbreaks-and-advisories/fda-alert-pet-owners-and-veterinarians';
    if (recall.source === 'fda_rss') return 'https://www.fda.gov/about-fda/contact-fda/stay-informed#702504';
    if (recall.source === 'fda_vet_recalls') return 'https://www.fda.gov/animal-veterinary/safety-health/recalls-withdrawals';
    return null;
  }

  // Must be http/https
  if (!url.startsWith('http://') && !url.startsWith('https://')) return null;

  return url;
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
    // Filter to dog-related only, and resolve source URLs to real pages
    recalls = (data || []).filter(isDogRelated).map(r => ({
      ...r,
      source_url: resolveSourceUrl(r),
    }));
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
