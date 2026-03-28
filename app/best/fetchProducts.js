import { getSupabase } from '@/lib/supabaseServer'

/**
 * Fetch products by slug pairs and return them in the specified order.
 * @param {Array<{brand_slug: string, slug: string}>} slugPairs
 */
export async function fetchProductsBySlugs(slugPairs) {
  const supabase = getSupabase()
  const results = await Promise.all(
    slugPairs.map(({ brand_slug, slug }) =>
      supabase
        .from('dog_foods_v2')
        .select('*')
        .eq('brand_slug', brand_slug)
        .eq('slug', slug)
        .single()
        .then(({ data, error }) => {
          if (error) console.error(`[BestOf] Failed to fetch ${brand_slug}/${slug}:`, error.message)
          return data
        })
    )
  )
  const found = results.filter(Boolean)
  console.log(`[BestOf] Fetched ${found.length}/${slugPairs.length} products`)
  return found
}
