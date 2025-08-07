// /pages/api/create-checkout-session/index.ts

import { stripe } from '@/utils/stripe';
import { getUser } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { priceId, plan } = req.body;

  const { user } = await getUser({ req, res });

  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/results?success=true`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        plan, // This is key: pass which plan (Starter or Pro) was selected
        user_id: user.id,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe session error:', err);
    return res.status(500).json({ error: 'Stripe session failed' });
  }
}
