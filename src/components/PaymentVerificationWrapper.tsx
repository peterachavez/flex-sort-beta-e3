import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import ResultsDashboard from './ResultsDashboard';
import { AssessmentData } from '../pages/Index';

interface PaymentVerificationWrapperProps {
  data: AssessmentData;
  tier: string;
  sessionId?: string;
}

interface VerificationResult {
  verified: boolean;
  plan_tier?: string;
  error?: string;
  details?: string;
}

const PaymentVerificationWrapper = ({ data, tier, sessionId }: PaymentVerificationWrapperProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifiedTier, setVerifiedTier] = useState<string>(tier);

  useEffect(() => {
    // If we have a session_id from payment redirect, verify the payment
    if (sessionId && (tier === 'starter' || tier === 'pro')) {
      verifyPayment(sessionId);
    } else if (tier === 'free') {
      // Free tier doesn't need verification
      setVerificationResult({ verified: true });
    }
  }, [sessionId, tier]);

  const verifyPayment = async (session_id: string) => {
    console.log('Starting payment verification for session:', session_id);
    setIsVerifying(true);
    
    try {
      // Get the current user's session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Authentication error:', sessionError);
        setVerificationResult({
          verified: false,
          error: 'Authentication required. Please log in to verify your payment.'
        });
        return;
      }

      console.log('User authenticated, calling verify-payment function');
      
      // Call the verify-payment edge function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
        body: { session_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (verifyError) {
        console.error('Payment verification error:', verifyError);
        setVerificationResult({
          verified: false,
          error: 'Payment verification failed. Please contact support.',
          details: verifyError.message
        });
        return;
      }

      console.log('Payment verification response:', verifyData);

      if (verifyData.verified) {
        // Payment verified successfully
        setVerificationResult({
          verified: true,
          plan_tier: verifyData.plan_tier
        });
        setVerifiedTier(verifyData.plan_tier);
        console.log('Payment verified successfully for tier:', verifyData.plan_tier);
      } else {
        // Payment not verified
        setVerificationResult({
          verified: false,
          error: verifyData.error || 'Payment could not be verified',
          details: verifyData.details
        });
      }

    } catch (error) {
      console.error('Unexpected error during payment verification:', error);
      setVerificationResult({
        verified: false,
        error: 'An unexpected error occurred during payment verification.',
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetryVerification = () => {
    if (sessionId) {
      verifyPayment(sessionId);
    }
  };

  const handleContactSupport = () => {
    // You can customize this with your actual support contact method
    window.open('mailto:support@cogello.com?subject=Payment Verification Issue&body=Please help me verify my payment. Session ID: ' + sessionId, '_blank');
  };

  // Show verification loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              Verifying Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please wait while we verify your payment with Stripe...
            </p>
            <div className="text-sm text-gray-500">
              This usually takes just a few seconds.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show verification failure state
  if (verificationResult && !verificationResult.verified) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <XCircle className="h-6 w-6" />
              Payment Verification Failed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-2">
                {verificationResult.error}
              </p>
              {verificationResult.details && (
                <p className="text-red-600 text-sm">
                  Details: {verificationResult.details}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleRetryVerification}
                className="w-full"
                disabled={!sessionId}
              >
                Retry Verification
              </Button>
              
              <Button 
                onClick={handleContactSupport}
                variant="outline"
                className="w-full"
              >
                Contact Support
              </Button>
            </div>

            <div className="text-xs text-gray-500 mt-4">
              Session ID: {sessionId || 'Not provided'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show verification success with premium unlock message
  if (verificationResult && verificationResult.verified && (verifiedTier === 'starter' || verifiedTier === 'pro') && sessionId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-50 border-b border-green-200 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">
                Payment verified successfully! 
              </p>
              <p className="text-green-700 text-sm">
                You now have access to your {verifiedTier === 'pro' ? 'Pro Plan' : 'Starter Plan'} results.
              </p>
            </div>
          </div>
        </div>
        <ResultsDashboard data={data} tier={verifiedTier} />
      </div>
    );
  }

  // Default: show results (for free tier or already verified)
  return <ResultsDashboard data={data} tier={verifiedTier} />;
};

export default PaymentVerificationWrapper;