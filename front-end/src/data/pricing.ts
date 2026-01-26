import { IProduct } from "@/types"

export const PRICING_PLANS:IProduct[] = [
    {
        id: 'basic',
        name: 'Basic',
        description: 'Perfect for getting started',
        priceInCents: 999,
        currency: 'USD',
        active: true,
        createdAt: new Date().toString(),
        type: '',
        externalPriceId: '',
        externalProductId: '',
        features: [
            'Up to 5 projects',
            'Basic analytics',
            'Email support',
            'Community access'
        ]
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Everything you need to grow your business',
        priceInCents: 2999,
        currency: 'USD',
        active: true,
        createdAt: new Date().toString(),
        type: '',
        externalPriceId: '',
        externalProductId: '',
        features: [
            'Unlimited projects',
            'Advanced analytics',
            'Priority support',
            'Custom domain',
            'API access'
        ]
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large teams and organizations',
        priceInCents: 9999,
        currency: 'USD',
        active: true,
        createdAt: new Date().toString(),
        type: '',
        externalPriceId: '',
        externalProductId: '',
        features: [
            'Everything in Pro',
            'SSO integration',
            'Dedicated support',
            'Custom integrations',
            'SLA guarantee'
        ]
    }
]

export type PricingPlan = typeof PRICING_PLANS[number]