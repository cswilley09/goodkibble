import { NextResponse } from 'next/server';

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { first_name, email, zip_code, heard_from, dogs, dog } = body;

    if (!first_name || !email || !zip_code) {
      return NextResponse.json({ error: 'First name, email, and zip code are required.' }, { status: 400 });
    }

    // Support both single dog (legacy) and multi-dog payloads
    const dogList = dogs || (dog ? [dog] : []);
    if (dogList.length === 0 || !dogList[0].dog_name) {
      return NextResponse.json({ error: 'At least one dog profile is required.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Insert user profile
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .insert({ first_name, email, zip_code, heard_from: heard_from || null, signup_data: body })
      .select('id')
      .single();

    if (userError) {
      if (userError.code === '23505') {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      console.error('User insert error:', userError);
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    // Insert all dog profiles
    const dogRows = dogList.map(d => ({
      user_id: user.id,
      dog_name: d.dog_name,
      breed: d.breed,
      age_value: d.age_value,
      age_unit: d.age_unit,
      weight_lbs: d.weight_lbs,
      gender: d.gender,
      is_neutered: d.is_neutered,
      current_food: d.current_food,
      current_food_slug: d.current_food_slug || null,
      priorities: d.priorities || [],
    }));

    const { data: dogProfiles, error: dogError } = await supabase
      .from('dog_profiles')
      .insert(dogRows)
      .select('id');

    if (dogError) {
      console.error('Dog insert error:', dogError);
      await supabase.from('user_profiles').delete().eq('id', user.id);
      return NextResponse.json({ error: 'Failed to save dog profiles. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      user_id: user.id,
      dog_ids: dogProfiles.map(d => d.id),
      // Legacy compat
      dog_id: dogProfiles[0]?.id,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
