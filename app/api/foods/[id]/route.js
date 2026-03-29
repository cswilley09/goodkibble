import { getSupabase } from '@/lib/supabaseServer'
import { checkRateLimit } from '@/lib/rateLimit'

export async function GET(request, { params }) {
  const limited = checkRateLimit(request)
  if (limited) return limited

  const { id } = params
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('dog_foods_v2')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}
