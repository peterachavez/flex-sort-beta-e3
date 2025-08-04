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
    console.log("Creating checkout session...");
    
    // Get environment variables with detailed logging
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const starterPriceId = Deno.env.get("STARTER_PRICE_ID");
    const proPriceId = Deno.env.get("PRO_PRICE_ID");

    console.log("Environment variables check:", {
      hasStripeKey: !!stripeSecretKey,
      hasStarterPrice: !!starterPriceId,
      hasProPrice: !!proPriceId
    });

    // Validate required environment variables
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set. Please add it in Supabase Edge Functions settings.");
    }

    if (!starterPriceId || !proPriceId) {
      throw new Error("STARTER_PRICE_ID and PRO_PRICE_ID environment variables must be set. Please add them in Supabase Edge Functions settings.");
    }

    // Initialize Stripe with secret key
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Parse request body and validate planType
    const { planType } = await req.json();
    console.log("Plan type requested:", planType);

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

    // Validate planType
    if (!priceConfig[planType as keyof typeof priceConfig]) {
      throw new Error(`Invalid plan type: ${planType}. Must be 'starter' or 'pro'.`);
    }

    const config = priceConfig[planType as keyof typeof priceConfig];
    
    // Get and validate origin for redirect URLs
    const origin = req.headers.get("origin") || req.headers.get("referer")?.split('/').slice(0, 3).join('/') || "http://localhost:5173";
    
    // Ensure origin has protocol
    const validatedOrigin = origin.startsWith('http') ? origin : `https://${origin}`;
    
    console.log("Origin validation:", {
      rawOrigin: req.headers.get("origin"),
      referer: req.headers.get("referer"),
      finalOrigin: validatedOrigin
    });
    
    console.log("Using config:", { 
      planType, 
      priceId: config.priceId, 
      amount: config.amount, 
      origin: validatedOrigin 
    });

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

    // Construct redirect URLs with custom success URLs per plan
    const successUrls = {
      starter: "https://pay.cogello.com/b/bJeaEX6E45Vq44T0We5ZC00",
      pro: "https://pay.cogello.com/b/8x23cv9QgcjOathbAS5ZC01"
    };
    
    const successUrl = successUrls[planType as keyof typeof successUrls];
    const cancelUrl = `${validatedOrigin}/?canceled=true`;
    
    console.log("Redirect URLs:", {
      successUrl,
      cancelUrl
    });

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
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        planType: planType,
        userEmail: customerEmail || "guest",
      },
    });

    console.log("Checkout session created successfully:", {
      sessionId: session.id,
      sessionUrl: session.url,
      planType,
      priceId: config.priceId
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