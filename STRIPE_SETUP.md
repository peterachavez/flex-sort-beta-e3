# Stripe Integration Setup Guide

## 1. Stripe Configuration

### Get Your Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key** and **Secret Key**
3. For testing, use test keys (they start with `pk_test_` and `sk_test_`)

### Set Environment Variables
In your Supabase project settings, add these secrets:
- `STRIPE_SECRET_KEY` = your Stripe secret key (sk_test_... or sk_live_...)

### Create Stripe Products and Prices
1. Go to [Stripe Products](https://dashboard.stripe.com/products)
2. Create two products:
   - **Starter Plan**: $49.99 one-time payment
   - **Pro Plan**: $99.99 one-time payment
3. Copy the **Price IDs** (they start with `price_`)

## 2. Update Price IDs

In `supabase/functions/create-checkout-session/index.ts`, replace these lines:

```typescript
const priceConfig = {
  starter: {
    priceId: "price_1RsSH2EoPkN2ZliiH7MxOY8w", // Replace with actual Price ID
    amount: 4999,
    name: "Starter Plan - 3 Assessments"
  },
  pro: {
    priceId: "price_YOUR_PRO_PRICE_ID", // Replace with actual Price ID
    amount: 9999,
    name: "Pro Plan - 10 Assessments"
  }
};
```

## 3. Environment Variables Setup

Create these environment variables in your Supabase project:

```bash
# In Supabase Dashboard > Settings > Edge Functions > Secrets
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

And in your frontend `.env` file:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Deploy Edge Function

Deploy the checkout function to Supabase:
```bash
supabase functions deploy create-checkout-session
```

## 5. Test the Integration

1. Select a paid plan on your pricing page
2. Complete test payment using [Stripe test cards](https://stripe.com/docs/testing#cards)
3. Verify redirect to results page with correct plan benefits

## 6. Production Checklist

- [ ] Replace test keys with live keys
- [ ] Update price IDs with live product prices
- [ ] Test with real payment methods
- [ ] Set up Stripe webhooks (optional, for advanced tracking)
- [ ] Configure success/cancel URLs for your domain

## 7. Success/Cancel URLs

The checkout session is configured to redirect to:
- **Success**: `/results?tier={planType}&session_id={CHECKOUT_SESSION_ID}`
- **Cancel**: `/?canceled=true`

Update the domain in the edge function for production:
```typescript
const origin = req.headers.get("origin") || "https://yourdomain.com";
```

## Support

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)