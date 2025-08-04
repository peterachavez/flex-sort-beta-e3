import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Payment verification started");

    // Authenticate the user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      logStep("ERROR: User authentication failed", { error: userError?.message });
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401 
        }
      );
    }

    logStep("User authenticated", { userId: userData.user.id, email: userData.user.email });

    // Parse request body to get session_id
    const { session_id } = await req.json();
    
    if (!session_id) {
      logStep("ERROR: No session_id provided in request");
      return new Response(
        JSON.stringify({ error: "session_id is required" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    logStep("Session ID received", { session_id });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment verification service not configured" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Stripe session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email 
    });

    // Verify payment is successful
    if (session.payment_status !== "paid") {
      logStep("Payment not completed", { payment_status: session.payment_status });
      return new Response(
        JSON.stringify({ 
          verified: false, 
          error: "Payment not completed",
          payment_status: session.payment_status 
        }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    // Determine plan tier based on amount paid
    let planTier = "free";
    if (session.amount_total) {
      const amountInDollars = session.amount_total / 100;
      logStep("Payment amount verified", { amountInDollars });
      
      if (amountInDollars >= 99) {
        planTier = "pro";
      } else if (amountInDollars >= 49) {
        planTier = "starter";
      }
    }

    // Optionally record the verified payment in the database
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    try {
      await supabaseService.from("purchases").upsert({
        user_id: userData.user.id,
        user_email: userData.user.email,
        stripe_session_id: session_id,
        plan_type: planTier,
        amount: session.amount_total || 0,
        currency: session.currency || "usd",
        status: "paid",
        metadata: {
          customer_id: session.customer,
          verification_timestamp: new Date().toISOString()
        }
      }, { onConflict: 'stripe_session_id' });
      
      logStep("Payment record updated in database");
    } catch (dbError) {
      logStep("WARNING: Failed to update database", { error: dbError });
      // Don't fail the verification if database update fails
    }

    logStep("Payment verification successful", { planTier, sessionId: session_id });

    return new Response(
      JSON.stringify({ 
        verified: true, 
        plan_tier: planTier,
        amount: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_email 
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in payment verification", { message: errorMessage, stack: error.stack });
    
    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: "Payment verification failed",
        details: errorMessage 
      }), 
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});