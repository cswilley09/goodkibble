import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email, message } = await request.json();
    if (!email || !message) {
      return NextResponse.json({ error: 'Email and message are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('food_requests')
      .insert({ email: email.trim(), message: message.trim() });

    if (error) {
      console.error('[food-request] Insert error:', error.message);
      return NextResponse.json({ error: 'Failed to save request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[food-request] Error:', err.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
