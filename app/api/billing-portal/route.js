import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });

    const stripe = require('stripe')(stripeKey);

    // Find the customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'No subscription found for this email' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || 'https://www.goodkibble.com';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error('Billing portal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
