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
    const { first_name, email, zip_code, heard_from, dog } = body;

    if (!first_name || !email || !zip_code) {
      return NextResponse.json({ error: 'First name, email, and zip code are required.' }, { status: 400 });
    }
    if (!dog || !dog.dog_name || !dog.breed || !dog.gender) {
      return NextResponse.json({ error: 'Dog profile information is required.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Insert user profile
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .insert({
        first_name,
        email,
        zip_code,
        heard_from: heard_from || null,
      })
      .select('id')
      .single();

    if (userError) {
      // Check for duplicate email
      if (userError.code === '23505') {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      console.error('User insert error:', userError);
      return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
    }

    // Insert dog profile
    const { data: dogProfile, error: dogError } = await supabase
      .from('dog_profiles')
      .insert({
        user_id: user.id,
        dog_name: dog.dog_name,
        breed: dog.breed,
        age_value: dog.age_value,
        age_unit: dog.age_unit,
        weight_lbs: dog.weight_lbs,
        gender: dog.gender,
        is_neutered: dog.is_neutered,
        current_food: dog.current_food,
        current_food_slug: dog.current_food_slug || null,
        priorities: dog.priorities || [],
      })
      .select('id')
      .single();

    if (dogError) {
      console.error('Dog insert error:', dogError);
      // Clean up the user if dog insert fails
      await supabase.from('user_profiles').delete().eq('id', user.id);
      return NextResponse.json({ error: 'Failed to save dog profile. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      user_id: user.id,
      dog_id: dogProfile.id,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
