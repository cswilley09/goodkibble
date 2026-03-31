import { NextResponse } from 'next/server';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const dogId = searchParams.get('dog_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Fetch user profile
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch dog profile
    let dog = null;
    if (dogId) {
      const { data, error: dogError } = await supabase
        .from('dog_profiles')
        .select('*')
        .eq('id', dogId)
        .eq('user_id', userId)
        .single();
      if (!dogError) dog = data;
    } else {
      // Fallback: get first dog for this user
      const { data, error: dogError } = await supabase
        .from('dog_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      if (!dogError) dog = data;
    }

    return NextResponse.json({ user, dog });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
