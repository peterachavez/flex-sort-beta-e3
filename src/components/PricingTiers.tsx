
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface PricingTiersProps {
  onTierSelect: (tier: string) => void;
}

const PricingTiers = ({ onTierSelect }: PricingTiersProps) => {
  const [selectedTier, setSelectedTier] = useState('premium');

  const tiers = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      description: 'Essential metrics and summary',
      features: [
        'Cognitive Flexibility Score',
        'Shifts Achieved',
        'Perseverative Errors',
        'Basic performance summary',
        'Digital report access'
      ]
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$19.99',
      description: 'Comprehensive analysis with AI insights',
      features: [
        'Everything in Basic',
        'AI-generated interpretation',
        'Adaptation latency analysis',
        'Response time patterns',
        'Plain-language summary',
        'Performance comparisons'
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$39.99',
      description: 'Full clinical-grade assessment',
      features: [
        'Everything in Standard',
        'Detailed bar graphs & charts',
        'Clinical interpretation',
        'Legal/educational summary',
        'PDF & CSV export',
        'Raw data download',
        'Professional formatting'
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
            onClick={() => onTierSelect(selectedTier)}
            className="bg-[#149854] hover:bg-[#149854]/90 text-white px-12 py-4 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {selectedTierData?.id === 'premium' ? 'Unlock Results - $39.99' : 
             selectedTierData?.id === 'standard' ? 'Select Standard - $19.99' : 
             'Select Basic - $9.99'}
          </Button>
        </div>

        {/* Bottom disclaimer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 max-w-2xl mx-auto">
            Secure payment processing. All reports include privacy protection and are available immediately after purchase. 
            30-day money-back guarantee if you're not satisfied with your results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingTiers;
