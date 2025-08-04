
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PricingTiersProps {
  onTierSelect: (tier: string) => void;
}

const PricingTiers = ({ onTierSelect }: PricingTiersProps) => {
  const [selectedTier, setSelectedTier] = useState('pro');
  const [isLoading, setIsLoading] = useState(false);

  const handlePlanSelection = async () => {
  if (selectedTier === 'free') {
    onTierSelect(selectedTier);
    return;
  }

  try {
    setIsLoading(true);

    const paymentUrls = {
      starter: 'https://pay.cogello.com/b/bJeaEX6E45Vq44T0We5ZC00',
      pro: 'https://pay.cogello.com/b/8x23cv9QgcjOathbAS5ZC01'
    };

    const paymentUrl = paymentUrls[selectedTier as keyof typeof paymentUrls];

    if (paymentUrl) {
      console.log('Redirecting to payment URL:', paymentUrl);
      
      // Use window.top to break out of iframe if needed
      if (window.top !== window.self) {
        window.top.location.href = paymentUrl;
      } else {
        window.location.href = paymentUrl;
      }
    } else {
      throw new Error('Invalid plan selected');
    }

  } catch (error) {
    console.error('Payment redirect error:', error);
    alert('Payment processing error. Please try again.');
    setIsLoading(false);
  }
};

  const tiers = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      description: 'One free cognitive assessment with basic results included',
      features: [
        'One assessment included',
        'Cognitive Flexibility Score',
        'Number of Shifts Achieved',
        'Count of Perseverative Errors',
        'Basic performance summary',
        'Immediate digital results'
      ]
    },
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '$49.99',
      description: '3 assessments with detailed insights and AI interpretation',
      features: [
        'Includes 3 separate assessments',
        'All features from Free',
        'AI-generated plain-language report',
        'Adaptation latency insights',
        'Response time breakdown',
        'Deeper performance analysis per session'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$99.99',
      description: '10 assessments with advanced export options',
      features: [
        'Includes 10 separate assessments',
        'All features from Starter Plan',
        'Clinical-style interpretation',
        'Legal/educational-use summary',
        'Professional formatting for PDF reports',
        'Downloadable PDF and CSV reports',
        'Raw data access'
      ],
      popular: true
    }
  ];

  const selectedTierData = tiers.find(tier => tier.id === selectedTier);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 py-12">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header with green checkmark */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#149854] rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">
            Your cognitive profile is ready
          </h1>
          <p className="text-gray-600 text-lg">
            Select a pricing tier to unlock your personalized results
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tiers.map((tier) => (
            <Card 
              key={tier.id} 
              className={`relative shadow-lg transition-all duration-200 hover:shadow-xl cursor-pointer ${
                selectedTier === tier.id
                  ? 'border-2 border-[#149854] bg-[#149854]/5' 
                  : 'border border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTier(tier.id)}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#149854] text-white px-4 py-1 text-sm">Most Popular</Badge>
                </div>
              )}
              
              <CardContent className="p-8 text-center h-full flex flex-col">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {tier.name}
                </h3>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {tier.price}
                </div>
                <p className="text-gray-600 text-sm mb-6">
                  {tier.description}
                </p>

                <ul className="space-y-3 mb-8 text-left flex-grow">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-[#149854] mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Selection indicator */}
                {selectedTier === tier.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-[#149854] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Single centered button below cards */}
        <div className="text-center mb-8">
          <Button 
            onClick={handlePlanSelection}
            disabled={isLoading}
            className="bg-[#149854] hover:bg-[#149854]/90 text-white px-12 py-4 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 
             selectedTierData?.id === 'pro' ? 'Unlock Results - $99.99' : 
             selectedTierData?.id === 'starter' ? 'Unlock Results - $49.99' : 
             'Select Free Plan - $0'}
          </Button>
        </div>

        {/* Bottom disclaimer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 max-w-2xl mx-auto">
            Secure payment processing. All reports include privacy protection and are available immediately after purchase. 
            7-day money-back guarantee if you're not satisfied with your results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingTiers;
