import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkRateLimit } from '@/lib/rateLimit'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { db: { schema: 'public' }, global: { headers: { 'Cache-Control': 'no-cache' } } }
  )
}

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export async function GET(request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const supabase = getSupabase()

  // Featured presets for homepage
  const featured = searchParams.get('featured')
  // Helper: filter out canary rows in JS (avoids PostgREST query plan caching)
  const stripCanary = (rows) => (rows || []).filter(r => !r.is_canary);

  if (featured === 'marquee') {
    // Raw fetch — cache-bust via unique header to defeat Next.js Data Cache
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/dog_foods_v2?select=id,name,brand,primary_protein,protein_dmb,fat_dmb,carbs_dmb,quality_score,image_url,slug,brand_slug,is_canary&quality_score=not.is.null&limit=250`;
    const res = await fetch(url, {
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'X-Cache-Bust': `${Date.now()}`,
      },
      cache: 'no-store',
    });
    const raw = await res.json();
    const cleaned = (raw || []).filter(r => !r.is_canary).map(({ is_canary, ...rest }) => rest);
    return NextResponse.json(cleaned, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'CDN-Cache-Control': 'no-store' }
    })
  }
  if (featured === 'scoring-demo') {
    const { data } = await supabase
      .from('dog_foods_v2')
      .select('name, brand, quality_score, score_breakdown, is_canary')
      .not('score_breakdown', 'is', null)
      .gte('quality_score', 80)
      .limit(30)
    return NextResponse.json(stripCanary(data))
  }

  // Brand filter
  const brand = searchParams.get('brand')
  if (brand) {
    const { data } = await supabase
      .from('dog_foods_v2')
      .select('id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score, slug, brand_slug, is_canary')
      .eq('brand', brand)
      .order('name')
    return NextResponse.json(stripCanary(data))
  }

  // All products (for discover page) — raw fetch to avoid Next.js cache
  const all = searchParams.get('all')
  if (all === 'true') {
    try {
      const cols = 'id,name,brand,flavor,protein_dmb,fat_dmb,carbs_dmb,fiber_dmb,primary_protein,image_url,quality_score,slug,brand_slug,is_canary';
      const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/dog_foods_v2?select=${cols}`;
      const hdrs = {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'X-Cache-Bust': `${Date.now()}`,
      };

      const r1 = await fetch(`${baseUrl}&limit=1000&offset=0`, { headers: hdrs, cache: 'no-store' });
      const d1 = await r1.json();
      if (!Array.isArray(d1)) return NextResponse.json([]);

      // Only fetch batch 2 if batch 1 was full
      let d2 = [];
      if (d1.length === 1000) {
        const r2 = await fetch(`${baseUrl}&limit=1000&offset=1000`, { headers: hdrs, cache: 'no-store' });
        const raw2 = await r2.json();
        if (Array.isArray(raw2)) d2 = raw2;
      }

      return NextResponse.json(stripCanary([...d1, ...d2]));
    } catch (err) {
      console.error('[foods all] Error:', err.message);
      return NextResponse.json([]);
    }
  }

  return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 })
}
