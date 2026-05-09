import Home from './HomePage';

async function getMarqueeData() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return [];

  try {
    const url = `${base}/rest/v1/dog_foods_v2?select=id,name,brand,primary_protein,protein_dmb,fat_dmb,carbs_dmb,quality_score,image_url,slug,brand_slug,is_canary&quality_score=not.is.null&limit=250`;
    const res = await fetch(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const raw = await res.json();
    return (raw || []).filter(r => !r.is_canary).map(({ is_canary, ...rest }) => rest);
  } catch {
    return [];
  }
}

// Mirrors discover's filter (non-canary rows) so the homepage pill always
// matches the discover total.
async function getCounts() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !key) return null;

  const hdrs = { apikey: key, Authorization: `Bearer ${key}` };
  const sel = 'brand,is_canary';
  try {
    const [r1, r2] = await Promise.all([
      fetch(`${base}/rest/v1/dog_foods_v2?select=${sel}&limit=1000&offset=0`, { headers: hdrs, next: { revalidate: 300 } }),
      fetch(`${base}/rest/v1/dog_foods_v2?select=${sel}&limit=1000&offset=1000`, { headers: hdrs, next: { revalidate: 300 } }),
    ]);
    if (!r1.ok) return null;
    const d1 = await r1.json();
    const d2 = r2.ok ? await r2.json() : [];
    const live = [...(Array.isArray(d1) ? d1 : []), ...(Array.isArray(d2) ? d2 : [])].filter(r => !r.is_canary);
    return { foods: live.length, brands: new Set(live.map(r => r.brand).filter(Boolean)).size };
  } catch {
    return null;
  }
}

export default async function Page() {
  const [marqueeData, counts] = await Promise.all([getMarqueeData(), getCounts()]);
  return <Home marqueeData={marqueeData} counts={counts} />;
}
