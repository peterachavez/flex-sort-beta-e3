'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PLANS = [
  {
    name: 'Free',
    price: 0,
    features: [
      'One assessment included',
      'Cognitive Flexibility Score',
      'Number of Shifts Achieved',
      'Count of Perseverative Errors',
      'Basic performance summary',
      'Immediate digital results',
    ],
    description: 'One free cognitive assessment with basic results included',
    priceId: null, // No Stripe payment
  },
  {
    name: 'Starter Plan',
    price: 49.99,
    features: [
      'Includes 3 separate assessments',
      'All features from Free',
      'AI-generated plain-language report',
      'Adaptation latency insights',
      'Response time breakdown',
      'Deeper performance analysis per session',
    ],
    description: '3 assessments with detailed insights and AI interpretation',
    priceId: process.env.NEXT_PUBLIC_STARTER_PRICE_ID,
  },
  {
    name: 'Pro Plan',
    price: 99.99,
    features: [
      'Includes 10 separate assessments',
      'All features from Starter Plan',
      'Clinical-style interpretation',
      'Legal/educational-use summary',
      'Professional formatting for PDF reports',
      'Downloadable PDF and CSV reports',
      'Raw data access',
    ],
    description: '10 assessments with advanced export options',
    priceId: process.env.NEXT_PUBLIC_PRO_PRICE_ID,
    mostPopular: true,
  },
]

export default function PricingTiers() {
  const [selected, setSelected] = useState(PLANS[2]) // Default: Pro
  const router = useRouter()

  const handleCheckout = async () => {
    if (selected.price === 0) {
      router.push('/results') // Directly show results
      return
    }

    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        priceId: selected.priceId,
        tier: selected.name, // optionally use this for metadata
      }),
    })

    if (!res.ok) {
      toast.error('Something went wrong. Please try again.')
      return
    }

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="flex flex-col items-center px-4 py-10">
      <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
      <h1 className="text-2xl font-semibold mb-2 text-center">Your cognitive profile is ready</h1>
      <p className="text-muted-foreground text-center mb-8">Select a pricing tier to unlock your personalized results</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 max-w-5xl w-full">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            onClick={() => setSelected(plan)}
            className={cn(
              'border rounded-lg p-6 shadow-sm cursor-pointer transition hover:shadow-md',
              selected.name === plan.name && 'border-green-600 ring-2 ring-green-500',
              plan.mostPopular && 'relative'
            )}
          >
            {plan.mostPopular && (
              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-bl-md">
                Most Popular
              </div>
            )}
            <h2 className="text-lg font-semibold mb-1">{plan.name}</h2>
            <p className="text-2xl font-bold mb-2">${plan.price}</p>
            <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={handleCheckout} className="w-full max-w-sm">
        {selected.price === 0
          ? 'Unlock Free Results'
          : `Unlock Results – $${selected.price}`}
      </Button>

      <p className="text-xs text-muted-foreground mt-4 text-center max-w-md">
        Secure payment processing. All reports include privacy protection and are available immediately after purchase.
        7-day money-back guarantee if you’re not satisfied with your results.
      </p>
    </div>
  )
}
