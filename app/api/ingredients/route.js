import { getSupabase } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('ingredient_info')
    .select('*')

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Dedupe by ingredient_name
  const seen = new Set()
  const deduped = (data || []).filter(i => {
    if (seen.has(i.ingredient_name)) return false
    seen.add(i.ingredient_name)
    return true
  })

  return Response.json(deduped)
}
