import { getSupabase } from '@/lib/supabaseServer'

function ingredientSlug(name) {
  if (!name) return ''
  return name.toLowerCase().trim()
    .replace(/[™®©]/g, '').replace(/&/g, 'and').replace(/[''']/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export default async function sitemap() {
  const supabase = getSupabase()
  const baseUrl = 'https://www.goodkibble.com'
  const { data: products, error } = await supabase
    .from('dog_foods_v2')
    .select('id, name, brand, slug, brand_slug')
    .or('is_canary.is.null,is_canary.eq.false')

  if (error) { console.error('Sitemap fetch error:', error); return [] }

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/brands`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/best/dog-food`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/best/puppy-food`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/best/large-breed-dog-food`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/best/grain-free-dog-food`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/ingredients`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
  ]

  const brandSlugs = [...new Set(products?.map(p => p.brand_slug).filter(Boolean))]
  const brandPages = brandSlugs.map(bs => ({
    url: `${baseUrl}/brands/${bs}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7,
  }))

  const seenSlugs = new Set()
  const productPages = []
  products?.forEach(p => {
    if (!p.brand_slug || !p.slug) return
    const fullSlug = `${p.brand_slug}/${p.slug}`
    if (seenSlugs.has(fullSlug)) return
    seenSlugs.add(fullSlug)
    productPages.push({
      url: `${baseUrl}/dog-food/${p.brand_slug}/${p.slug}`,
      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6,
    })
  })

  // Ingredient pages
  const { data: ingredients } = await supabase
    .from('ingredient_info')
    .select('ingredient_name')
  const seenIngSlugs = new Set()
  const ingredientPages = []
  ingredients?.forEach(ing => {
    const slug = ingredientSlug(ing.ingredient_name)
    if (!slug || seenIngSlugs.has(slug)) return
    seenIngSlugs.add(slug)
    ingredientPages.push({
      url: `${baseUrl}/ingredients/${slug}`,
      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5,
    })
  })

  return [...staticPages, ...brandPages, ...productPages, ...ingredientPages]
}
