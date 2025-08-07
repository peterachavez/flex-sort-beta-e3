import { serve } from 'https://deno.land/std/http/server.ts';
import Stripe from 'npm:stripe';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing session_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-01',
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ success: false, error: 'Payment not completed' }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user_id = session.metadata?.user_id;
    const plan = session.metadata?.plan;

    if (!user_id || !plan) {
      return new Response(JSON.stringify({ success: false, error: 'Missing metadata' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, user_id, plan }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Verify-payment error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
