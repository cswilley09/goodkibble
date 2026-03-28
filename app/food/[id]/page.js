import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function OldFoodRedirect({ params }) {
  const { id } = params
  const { data: product, error } = await supabase
    .from('dog_foods_v2')
    .select('slug, brand_slug')
    .eq('id', id)
    .single()

  if (error || !product || !product.slug || !product.brand_slug) {
    redirect('/search')
  }
  redirect(`/dog-food/${product.brand_slug}/${product.slug}`)
}
