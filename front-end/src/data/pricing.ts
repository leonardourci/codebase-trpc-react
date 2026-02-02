import { IProduct } from "@/types"

export const PRICING_PLANS: IProduct[] = [
    {
        id: 'basic',
        name: 'Em Dia',
        description: 'Perfect for getting started',
        priceInCents: 999,
        isFreeTier: true,
        maxProjects: 1,
        features: [
            'Up to 5 projects',
            'Basic analytics',
            'Email support',
            'Community access'
        ]
    },
    {
        id: '1d5198c4-d2f9-452b-ba8a-26a0c1685459',
        name: 'Em Alta',
        description: 'Everything you need to grow your business',
        priceInCents: 2999,
        isFreeTier: true,
        maxProjects: 1,
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
        name: 'Em Destaque',
        description: 'For large teams and organizations',
        priceInCents: 9999,
        isFreeTier: true,
        maxProjects: 1,
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