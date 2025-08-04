import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe with your secret key
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const { planType } = await req.json();

    // Price configuration - replace these with your actual Stripe Price IDs
    const priceConfig = {
      starter: {
        priceId: "price_STARTER_PLAN_ID", // Replace with your Starter plan Price ID
        amount: 4999, // $49.99
        name: "Starter Plan - 3 Assessments"
      },
      pro: {
        priceId: "price_PRO_PLAN_ID", // Replace with your Pro plan Price ID  
        amount: 9999, // $99.99
        name: "Pro Plan - 10 Assessments"
      }
    };

    if (!priceConfig[planType as keyof typeof priceConfig]) {
      throw new Error("Invalid plan type");
    }

    const config = priceConfig[planType as keyof typeof priceConfig];
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment
      success_url: `${origin}/results?tier=${planType}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        planType: planType,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});