import { getSupabase } from '@/lib/supabaseServer'
import IngredientsIndexContent from './IngredientsIndexContent'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  return {
    title: 'Dog Food Ingredients Glossary — 666 Ingredients Explained | Good Kibble',
    description: "What's really in your dog's food? Browse our glossary of 666 dog food ingredients with AAFCO-sourced explanations and quality ratings.",
    openGraph: {
      title: 'Dog Food Ingredients Glossary — 666 Ingredients Explained',
      description: "What's really in your dog's food? Browse 666 ingredients with quality ratings.",
      url: 'https://www.goodkibble.com/ingredients',
    },
    alternates: { canonical: 'https://www.goodkibble.com/ingredients' },
  }
}

export default async function IngredientsIndexPage() {
  const supabase = getSupabase()
  const { data: allIngredients } = await supabase
    .from('ingredient_info')
    .select('ingredient_name, display_name, category, quality_signal')
    .order('display_name')

  // Dedupe
  const seen = new Set()
  const ingredients = (allIngredients || []).filter(i => {
    if (seen.has(i.ingredient_name)) return false
    seen.add(i.ingredient_name)
    return true
  })

  return <IngredientsIndexContent ingredients={ingredients} />
}
