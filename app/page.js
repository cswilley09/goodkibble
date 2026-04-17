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

export default async function Page() {
  const marqueeData = await getMarqueeData();
  return <Home marqueeData={marqueeData} />;
}
