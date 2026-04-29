import { getSupabase } from '@/lib/supabaseServer'
import { generateBreadcrumbSchema } from '@/lib/seo'
import { ingredientSlug, CATEGORY_INFO, QUALITY_INFO } from '@/lib/ingredients'
import IngredientPageContent from './IngredientPageContent'

export const dynamic = 'force-dynamic'


async function getIngredient(slug) {
  const supabase = getSupabase()
  const { data: allIngredients } = await supabase
    .from('ingredient_info')
    .select('*')
  if (!allIngredients) return null
  const seen = new Set()
  const deduped = allIngredients.filter(i => {
    if (seen.has(i.ingredient_name)) return false
    seen.add(i.ingredient_name)
    return true
  })
  return deduped.find(i => ingredientSlug(i.ingredient_name) === slug) || null
}

async function getProducts(ingredientName) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('dog_foods_v2')
    .select('id, name, brand, brand_slug, slug, quality_score, image_url, protein, fat, primary_protein')
    .ilike('ingredients', `%${ingredientName}%`)
    .or('is_canary.is.null,is_canary.eq.false')
    .order('quality_score', { ascending: false, nullsFirst: false })
    .limit(20)
  return data || []
}

async function getRelated(category, currentName) {
  const supabase = getSupabase()
  const { data } = await supabase
    .from('ingredient_info')
    .select('ingredient_name, display_name, quality_signal')
    .eq('category', category)
    .limit(50)
  if (!data) return []
  const seen = new Set()
  return data
    .filter(i => {
      if (i.ingredient_name === currentName || seen.has(i.ingredient_name)) return false
      seen.add(i.ingredient_name)
      return true
    })
    .slice(0, 8)
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const ingredient = await getIngredient(slug)
  if (!ingredient) return { title: 'Ingredient Not Found | Good Kibble' }
  const supabase = getSupabase()
  const { count } = await supabase
    .from('dog_foods_v2')
    .select('id', { count: 'exact', head: true })
    .ilike('ingredients', `%${ingredient.ingredient_name}%`)
    .or('is_canary.is.null,is_canary.eq.false')
  return {
    title: `What is ${ingredient.display_name} in Dog Food? | Good Kibble`,
    description: `${ingredient.short_description} Found in ${count || 0} dog foods. See which products contain ${ingredient.display_name} and whether it's good for your dog.`,
    openGraph: {
      title: `What is ${ingredient.display_name} in Dog Food?`,
      description: ingredient.short_description,
      url: `https://www.goodkibble.com/ingredients/${slug}`,
    },
    alternates: { canonical: `https://www.goodkibble.com/ingredients/${slug}` },
  }
}

export default async function IngredientPage({ params }) {
  const { slug } = params
  const ingredient = await getIngredient(slug)
  if (!ingredient) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px', color: 'rgba(28,24,20,0.60)', fontSize: 17 }}>
        Ingredient not found. <a href="/ingredients" style={{ color: '#1C1814', textDecoration: 'underline' }}>Browse all ingredients</a>
      </div>
    )
  }

  const [products, related] = await Promise.all([
    getProducts(ingredient.ingredient_name),
    getRelated(ingredient.category, ingredient.ingredient_name),
  ])

  const supabase = getSupabase()
  const { count: productCount } = await supabase
    .from('dog_foods_v2')
    .select('id', { count: 'exact', head: true })
    .ilike('ingredients', `%${ingredient.ingredient_name}%`)
    .or('is_canary.is.null,is_canary.eq.false')

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [{
      '@type': 'Question',
      name: `What is ${ingredient.display_name} in dog food?`,
      acceptedAnswer: { '@type': 'Answer', text: ingredient.short_description },
    }],
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Ingredients', url: '/ingredients' },
    { name: ingredient.display_name },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <IngredientPageContent
        ingredient={ingredient}
        products={products}
        productCount={productCount || 0}
        related={related}
      />
    </>
  )
}
