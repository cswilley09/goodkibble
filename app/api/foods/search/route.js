import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimit'

function getSearchVariants(query) {
  const q = query.trim()
  if (!q) return []
  const variants = new Set()
  variants.add(q)
  const stripped = q.replace(/[''`]/g, '')
  variants.add(stripped)
  const withApostrophe = stripped.replace(/(\w)s\b/g, "$1's")
  variants.add(withApostrophe)
  const words = stripped.split(/\s+/)
  const firstWordApos = words.map((w, i) => {
    if (i === 0 && w.length > 2 && w.endsWith('s')) return w.slice(0, -1) + "'s"
    return w
  }).join(' ')
  variants.add(firstWordApos)
  if (words.length >= 4) {
    const stopWords = new Set(['and', 'the', 'for', 'with', 'dry', 'dog', 'food', 'recipe', 'formula', 'adult', 'puppy', 'senior', 'natural', 'grain', 'free'])
    const significant = words.filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()))
    if (significant.length >= 2) {
      variants.add(significant.slice(0, 3).join(' '))
      variants.add(significant.slice(0, 2).join(' '))
    }
  }
  return [...variants].filter(v => v.length > 0)
}

function buildOrFilter(variants, columns) {
  const clauses = []
  for (const col of columns) {
    for (const v of variants) clauses.push(`${col}.ilike.%${v}%`)
  }
  return clauses.join(',')
}

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 200)
  const compact = searchParams.get('compact') === 'true'

  let supabase
  try {
    supabase = getSupabase()
  } catch (err) {
    console.error('[search] Supabase init error:', err.message)
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
  }

  const variants = getSearchVariants(q)
  if (variants.length === 0) return NextResponse.json([])

  const selectCols = compact
    ? 'id, name, brand, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, moisture, ingredients, image_url, quality_score, is_canary'
    : 'id, name, brand, flavor, protein_dmb, fat_dmb, carbs_dmb, fiber_dmb, primary_protein, image_url, quality_score, slug, brand_slug, ingredients, is_canary'

  // Pass 1: brand matches
  const brandFilter = buildOrFilter(variants, ['brand'])
  const { data: brandMatches, error: e1 } = await supabase
    .from('dog_foods_v2').select(selectCols).or(brandFilter).limit(limit)
  if (e1) console.error('[search] pass1 error:', e1.message)

  // Pass 2: name/flavor matches
  const nameFilter = buildOrFilter(variants, ['name', 'flavor'])
  const { data: nameMatches, error: e2 } = await supabase
    .from('dog_foods_v2').select(selectCols).or(nameFilter).limit(limit)
  if (e2) console.error('[search] pass2 error:', e2.message)

  // Pass 3: individual word search
  let wordMatches = []
  const queryWords = q.toLowerCase().replace(/[''`]/g, '').split(/\s+/).filter(w => w.length > 2)
  if (queryWords.length >= 2) {
    const stopWords = new Set(['and', 'the', 'for', 'with', 'dry', 'dog', 'food', 'recipe', 'formula', 'adult', 'puppy', 'senior', 'natural', 'grain', 'free'])
    const meaningful = queryWords.filter(w => !stopWords.has(w))
    if (meaningful.length >= 1) {
      const bestWord = meaningful.sort((a, b) => b.length - a.length)[0]
      const wordFilter = buildOrFilter([bestWord], ['name', 'brand', 'flavor'])
      const { data, error: e3 } = await supabase
        .from('dog_foods_v2').select(selectCols).or(wordFilter).limit(limit)
      if (e3) console.error('[search] pass3 error:', e3.message)
      wordMatches = data || []
    }
  }

  // Merge & dedupe
  const seen = new Set()
  const merged = []
  for (const item of (brandMatches || [])) { if (!seen.has(item.id)) { seen.add(item.id); merged.push(item) } }
  for (const item of (nameMatches || [])) { if (!seen.has(item.id)) { seen.add(item.id); merged.push(item) } }
  for (const item of wordMatches) { if (!seen.has(item.id)) { seen.add(item.id); merged.push(item) } }

  // Relevance sort
  const allWords = q.toLowerCase().replace(/[''`]/g, '').split(/\s+/).filter(w => w.length > 1)
  function relevanceScore(item) {
    const text = `${item.brand} ${item.name} ${item.flavor || ''}`.toLowerCase()
    let score = 0
    for (const word of allWords) { if (text.includes(word)) score += 1 }
    const strippedQuery = q.toLowerCase().replace(/[''`]/g, '').trim()
    if (item.name.toLowerCase().includes(strippedQuery)) score += 10
    const combined = `${item.brand} ${item.name}`.toLowerCase()
    if (combined.includes(strippedQuery)) score += 10
    if (allWords[0] && item.brand.toLowerCase().includes(allWords[0])) score += 3
    return score
  }
  merged.sort((a, b) => relevanceScore(b) - relevanceScore(a))

  // Filter out canary/test products and strip the flag from responses
  const filtered = merged.filter(item => !item.is_canary).map(({ is_canary, ...rest }) => rest)

  return NextResponse.json(filtered)
}
