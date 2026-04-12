import { NextResponse } from 'next/server';

/*
  STRIPE SETUP REQUIRED:
  1. Create Stripe account at stripe.com
  2. Create two Products in Stripe Dashboard:
     - "GoodKibble Pro Yearly" — $29/year recurring → get price_xxxxx
     - "GoodKibble Pro Monthly" — $3.99/month recurring → get price_xxxxx
  3. Add to Vercel environment variables:
     - STRIPE_SECRET_KEY=sk_test_xxxxx (or sk_live_xxxxx for production)
     - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
  4. Replace the PRICE_IDs below with your actual Stripe Price IDs
*/

const PRICE_IDS = {
  yearly: process.env.STRIPE_PRICE_YEARLY || 'price_yearly_placeholder',
  monthly: process.env.STRIPE_PRICE_MONTHLY || 'price_monthly_placeholder',
};

export async function POST(request) {
  try {
    const { email, plan } = await request.json();

    if (!email || !plan) {
      return NextResponse.json({ error: 'Email and plan are required.' }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('placeholder')) {
      return NextResponse.json({ error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY to environment variables.' }, { status: 500 });
    }

    const stripe = require('stripe')(stripeKey);

    const priceId = PRICE_IDS[plan];
    if (!priceId || priceId.includes('placeholder')) {
      return NextResponse.json({ error: 'Stripe price IDs not configured.' }, { status: 500 });
    }

    const origin = request.headers.get('origin') || 'https://www.goodkibble.com';

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pro`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err?.message || err);
    return NextResponse.json({
      error: `Checkout failed: ${err?.message || 'Unknown error'}`,
      debug: {
        hasKey: !!process.env.STRIPE_SECRET_KEY,
        keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
        yearlyPrice: PRICE_IDS.yearly?.substring(0, 10) || 'missing',
        monthlyPrice: PRICE_IDS.monthly?.substring(0, 10) || 'missing',
      }
    }, { status: 500 });
  }
}
