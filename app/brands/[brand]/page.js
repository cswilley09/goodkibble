import { createClient } from '@supabase/supabase-js'
import { generateBrandMeta, getBrandDisplayName } from '@/lib/seo'
import BrandPageContent from './BrandPageContent'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function generateMetadata({ params }) {
  const { brand } = params
  const { count } = await getSupabase()
    .from('dog_foods_v2')
    .select('id', { count: 'exact', head: true })
    .eq('brand_slug', brand)
  const { title, description } = generateBrandMeta(brand, count || 0)
  return {
    title,
    description,
    openGraph: { title, description, url: `https://www.goodkibble.com/brands/${brand}` },
    alternates: { canonical: `https://www.goodkibble.com/brands/${brand}` },
  }
}

export default async function BrandPage({ params }) {
  const { brand } = params
  const brandName = getBrandDisplayName(brand)
  const { data: products } = await getSupabase()
    .from('dog_foods_v2')
    .select('id, name, brand, slug, brand_slug, image_url, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, quality_score, primary_protein, flavor')
    .eq('brand_slug', brand)
    .order('name')

  const items = products || []
  const avgScore = items.length > 0
    ? Math.round(items.reduce((s, p) => s + (p.quality_score || 0), 0) / items.filter(p => p.quality_score).length)
    : null
  const avgProtein = items.length > 0
    ? (items.reduce((s, p) => s + (p.protein_dmb || 0), 0) / items.filter(p => p.protein_dmb).length).toFixed(1)
    : null
  const avgFat = items.length > 0
    ? (items.reduce((s, p) => s + (p.fat_dmb || 0), 0) / items.filter(p => p.fat_dmb).length).toFixed(1)
    : null

  return (
    <BrandPageContent
      brandName={brandName}
      brandSlug={brand}
      products={items}
      avgScore={avgScore}
      avgProtein={avgProtein}
      avgFat={avgFat}
    />
  )
}
