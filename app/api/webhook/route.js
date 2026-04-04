import { NextResponse } from 'next/server';

/*
  STRIPE WEBHOOK SETUP:
  1. In Stripe Dashboard → Developers → Webhooks
  2. Add endpoint URL: https://your-domain.com/api/webhook
  3. Select events: checkout.session.completed, customer.subscription.deleted, customer.subscription.updated
  4. Copy the webhook signing secret and add to Vercel env as STRIPE_WEBHOOK_SECRET
*/

export async function POST(request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    console.error('Stripe keys not configured');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const stripe = require('stripe')(stripeKey);
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_email;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      const { error } = await supabase
        .from('user_profiles')
        .update({
          is_pro: true,
          pro_since: new Date().toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
        })
        .eq('email', email);

      if (error) console.error('Failed to update pro status:', error);
      else console.log(`[Webhook] Pro activated for ${email}`);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const { error } = await supabase
        .from('user_profiles')
        .update({ is_pro: false })
        .eq('stripe_customer_id', customerId);

      if (error) console.error('Failed to deactivate pro:', error);
      else console.log(`[Webhook] Pro deactivated for customer ${customerId}`);
    }

    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      console.log(`[Webhook] Subscription updated: ${subscription.id}, status: ${subscription.status}`);
      // Handle plan changes or status updates as needed
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }

  return NextResponse.json({ received: true });
}
