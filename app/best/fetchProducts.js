import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

/**
 * Fetch products by slug pairs and return them in the specified order.
 * @param {Array<{brand_slug: string, slug: string}>} slugPairs
 */
export async function fetchProductsBySlugs(slugPairs) {
  const results = await Promise.all(
    slugPairs.map(({ brand_slug, slug }) =>
      supabase
        .from('dog_foods_v2')
        .select('*')
        .eq('brand_slug', brand_slug)
        .eq('slug', slug)
        .single()
        .then(({ data }) => data)
    )
  )
  return results.filter(Boolean)
}
