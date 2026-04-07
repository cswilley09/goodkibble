import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(request) {
  try {
    const { admin_secret, product } = await request.json();

    const secret = process.env.ADMIN_SECRET || 'gk_admin_2026';
    if (admin_secret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!product?.slug) {
      return NextResponse.json({ error: 'Product data with slug required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check for existing
    const { data: existing } = await supabase
      .from('dog_foods_v2')
      .select('id, slug')
      .eq('slug', product.slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'This product already exists in the database' }, { status: 409 });
    }

    // Strip DMB columns (generated in Supabase)
    const { protein_dmb, fat_dmb, fiber_dmb, carbs_dmb, ...dbRow } = product;

    const { data: inserted, error: dbError } = await supabase
      .from('dog_foods_v2')
      .insert(dbRow)
      .select('*')
      .single();

    if (dbError) {
      return NextResponse.json({ error: `Database: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: inserted });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
