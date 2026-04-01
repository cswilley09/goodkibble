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
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'user_id or email is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Fetch user profile by id or email
    let userQuery = supabase.from('user_profiles').select('*');
    if (userId) userQuery = userQuery.eq('id', userId);
    else userQuery = userQuery.eq('email', email);
    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch ALL dog profiles for this user
    const { data: dogs, error: dogError } = await supabase
      .from('dog_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    return NextResponse.json({ user, dogs: dogs || [] });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
