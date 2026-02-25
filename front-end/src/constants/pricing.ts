export const PRICING_PLANS = [
    {
        id: 'basic',
        name: 'basic',
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
        id: 'pro',
        name: 'pro',
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
        name: 'enterprise',
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
] as const

export type PricingPlan = typeof PRICING_PLANS[number]
