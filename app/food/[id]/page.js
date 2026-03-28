import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseServer'

export default async function OldFoodRedirect({ params }) {
  const { id } = params
  const supabase = getSupabase()
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
