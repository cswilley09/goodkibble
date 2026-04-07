import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function POST(request) {
  try {
    const { products, admin_secret } = await request.json();
    const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
    if (admin_secret !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!products?.length) return NextResponse.json({ error: 'No products' }, { status: 400 });

    const supabase = getSupabase();
    let saved = 0, skipped = 0;
    const errors = [];

    for (const p of products) {
      try {
        const { data: existing } = await supabase.from('dog_foods_v2').select('id').eq('slug', p.slug).maybeSingle();
        if (existing) { skipped++; continue; }

        // Strip generated columns
        const { protein_dmb, fat_dmb, fiber_dmb, carbs_dmb, ...row } = p;
        const { error: dbErr } = await supabase.from('dog_foods_v2').insert(row);
        if (dbErr) { errors.push(`${p.name}: ${dbErr.message}`); continue; }
        saved++;
      } catch (err) { errors.push(`${p.name}: ${err.message}`); }
    }

    return NextResponse.json({ success: true, saved, skipped, errors });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
