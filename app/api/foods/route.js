import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const supabase = getSupabase()

  // Featured presets for homepage
  const featured = searchParams.get('featured')
  if (featured === 'marquee') {
    const { data } = await supabase
      .from('dog_foods_v2')
      .select('id, name, brand, primary_protein, protein_dmb, fat_dmb, carbs_dmb, quality_score, image_url, slug, brand_slug')
      .not('quality_score', 'is', null)
      .or('is_canary.is.null,is_canary.eq.false')
      .limit(200)
    return NextResponse.json(data || [])
  }
  if (featured === 'scoring-demo') {
    const { data } = await supabase
      .from('dog_foods_v2')
      .select('name, brand, quality_score, score_breakdown')
      .not('score_breakdown', 'is', null)
      .gte('quality_score', 80)
      .or('is_canary.is.null,is_canary.eq.false')
      .limit(20)
    return NextResponse.json(data || [])
  }

  // Brand filter
  const brand = searchParams.get('brand')
  if (brand) {
    const { data } = await supabase
      .from('dog_foods_v2')
      .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score, slug, brand_slug')
      .eq('brand', brand)
      .or('is_canary.is.null,is_canary.eq.false')
      .order('name')
    return NextResponse.json(data || [])
  }

  // All products (for discover page) - paginated
  const all = searchParams.get('all')
  if (all === 'true') {
    const offset = parseInt(searchParams.get('offset') || '0')
    const batch = parseInt(searchParams.get('batch') || '1000')
    const { data } = await supabase
      .from('dog_foods_v2')
      .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score, slug, brand_slug')
      .or('is_canary.is.null,is_canary.eq.false')
      .range(offset, offset + batch - 1)
    return NextResponse.json(data || [])
  }

  return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
}
