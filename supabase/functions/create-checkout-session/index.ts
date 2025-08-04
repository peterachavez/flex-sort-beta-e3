import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Get environment variables
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const starterPriceId = Deno.env.get("STARTER_PLAN_PRICE_ID");
    const proPriceId = Deno.env.get("PRO_PLAN_PRICE_ID");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set");
    }

    if (!starterPriceId || !proPriceId) {
      throw new Error("STARTER_PLAN_PRICE_ID and PRO_PLAN_PRICE_ID environment variables must be set");
    }

    // Initialize Stripe with secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const { planType } = await req.json();

    // Price configuration using environment variables
    const priceConfig = {
      starter: {
        priceId: starterPriceId,
        amount: 4999, // $49.99
        name: "Starter Plan - 3 Assessments"
      },
      pro: {
        priceId: proPriceId,
        amount: 9999, // $99.99
        name: "Pro Plan - 10 Assessments"
      }
    };

    if (!priceConfig[planType as keyof typeof priceConfig]) {
      throw new Error("Invalid plan type");
    }

    const config = priceConfig[planType as keyof typeof priceConfig];
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Get user email from auth if available
    let customerEmail = undefined;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );
        
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        
        if (userData.user?.email) {
          customerEmail = userData.user.email;
        }
      }
    } catch (authError) {
      console.log("Auth error (non-critical):", authError);
      // Continue without email if auth fails
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price: config.priceId,
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment
      success_url: `${origin}/?tier=${planType}&session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${origin}/?canceled=true`,
      metadata: {
        planType: planType,
        userEmail: customerEmail || "guest",
      },
    });

    console.log("Checkout session created:", session.id);

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