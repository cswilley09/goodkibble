import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { session_id, user_id, email } = await request.json();

    if (!session_id || !email) {
      return NextResponse.json({ error: 'Missing session_id or email' }, { status: 400 });
    }

    // Verify the checkout session with Stripe
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const stripe = require('stripe')(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Verify email matches
    if (session.customer_email !== email) {
      return NextResponse.json({ error: 'Email mismatch' }, { status: 403 });
    }

    // Update user profile
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_pro: true,
        pro_since: new Date().toISOString(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
      .eq('email', email);

    if (error) {
      console.error('Failed to activate pro:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Activate pro error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
