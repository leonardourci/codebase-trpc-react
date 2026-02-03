import type { IPricingPlan } from "../types/pricing.types";

export const PRICING_PLANS: IPricingPlan[] = [
    {
        name: "Free",
        description: "Free tier with basic features",
        priceInCents: 0,
        externalProductId: null,
        externalPriceId: null,
        active: true,
        isFreeTier: true,
        maxProjects: 5,
        features: [
            "Up to 5 projects",
            "Basic analytics",
            "Email support",
            "Community access",
        ],
    },
    {
        name: "Pro",
        description: "Everything you need to grow",
        priceInCents: 4999,
        externalProductId: "prod_YOUR_PRO_ID",
        externalPriceId: "price_YOUR_PRO_ID",
        active: true,
        isFreeTier: false,
        maxProjects: null,
        features: [
            "Unlimited projects",
            "Advanced analytics",
            "Priority support",
            "API access",
            "Custom integrations",
        ],
    },
    {
        name: "Enterprise",
        description: "For large teams",
        priceInCents: 9999,
        externalProductId: "prod_YOUR_ENTERPRISE_ID",
        externalPriceId: "price_YOUR_ENTERPRISE_ID",
        active: true,
        isFreeTier: false,
        maxProjects: null,
        features: [
            "Everything in Pro",
            "SSO integration",
            "Dedicated support",
            "Custom integrations",
            "SLA guarantee",
        ],
    },
];

export function validatePricingConfig(): void {
    const freeTiers = PRICING_PLANS.filter((p) => p.isFreeTier);

    if (freeTiers.length === 0) {
        throw new Error("Pricing config must have exactly one free tier");
    }

    if (freeTiers.length > 1) {
        throw new Error(
            `Pricing config has ${freeTiers.length} free tiers, must have exactly one`,
        );
    }

    if (freeTiers[0]!.priceInCents !== 0) {
        throw new Error("Free tier must have priceInCents = 0");
    }

    const paidPlans = PRICING_PLANS.filter((p) => !p.isFreeTier);
    for (const plan of paidPlans) {
        if (!plan.externalPriceId) {
            throw new Error(`Paid plan "${plan.name}" missing externalPriceId`);
        }
    }
}

validatePricingConfig();
