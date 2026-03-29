const hits = new Map()
const WINDOW_MS = 60 * 1000
const MAX_HITS = 60

export function checkRateLimit(request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const now = Date.now()
  const entry = hits.get(ip)

  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 })
    return null
  }

  entry.count++
  if (entry.count > MAX_HITS) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'content-type': 'application/json', 'Retry-After': '60' },
    })
  }

  return null
}

// Periodically clean old entries to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of hits) {
      if (now - entry.start > WINDOW_MS * 2) hits.delete(ip)
    }
  }, WINDOW_MS * 2)
}
