import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { id } = params
  const supabase = getSupabase()

  // Support lookup by numeric ID or by "brand_slug/product_slug"
  if (/^\d+$/.test(id)) {
    const { data, error } = await supabase
      .from('dog_foods_v2')
      .select('*')
      .eq('id', id)
      .or('is_canary.is.null,is_canary.eq.false')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  }

  // Slug-based lookup: id is "brand_slug" and product slug is in searchParams
  const { searchParams } = new URL(request.url)
  const productSlug = searchParams.get('slug')
  if (productSlug) {
    const { data, error } = await supabase
      .from('dog_foods_v2')
      .select('*')
      .eq('brand_slug', id)
      .eq('slug', productSlug)
      .or('is_canary.is.null,is_canary.eq.false')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Invalid id format' }, { status: 400 })
}
