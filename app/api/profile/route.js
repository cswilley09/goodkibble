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

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { dog_id, user_id, updates } = body;

    if ((!dog_id && !user_id) || !updates) {
      return NextResponse.json({ error: 'dog_id or user_id and updates are required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Update user_profiles if user_id is provided
    if (user_id) {
      const userAllowed = ['notification_recalls', 'notification_score_changes', 'notification_methodology', 'notification_new_foods', 'notification_tips'];
      const userClean = {};
      for (const key of userAllowed) {
        if (updates[key] !== undefined) userClean[key] = updates[key];
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .update(userClean)
        .eq('id', user_id)
        .select('*')
        .single();
      if (error) {
        console.error('User update error:', error);
        return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
      }
      return NextResponse.json(data);
    }

    // Update dog_profiles if dog_id is provided
    const allowed = ['dog_name', 'breed', 'age_value', 'age_unit', 'weight_lbs', 'gender', 'is_neutered', 'current_food', 'current_food_slug'];
    const clean = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) clean[key] = updates[key];
    }

    const { data, error } = await supabase
      .from('dog_profiles')
      .update(clean)
      .eq('id', dog_id)
      .select('*')
      .single();

    if (error) {
      console.error('Dog update error:', error);
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
