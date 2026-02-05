import type { IPricingPlan } from "../types/pricing.types";
import { EBillingPeriod } from "../types/pricing.types";

export const PRICING_PLANS: IPricingPlan[] = [
    {
        name: "Free",
        description: "Free tier with basic features",
        priceInCents: 0,
        billingPeriod: EBillingPeriod.MONTHLY,
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
        priceInCents: 2990,
        billingPeriod: EBillingPeriod.MONTHLY,
        externalProductId: "prod_TtaWqAfTdcspvK",
        externalPriceId: "price_1SvnLpPUl9sTYXHR9yk4VPG3",
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
        name: "Pro",
        description: "Everything you need to grow",
        priceInCents: 29000,
        billingPeriod: EBillingPeriod.YEARLY,
        externalProductId: "prod_TtaWqAfTdcspvK",
        externalPriceId: "price_1SxCQYPUl9sTYXHRZdEhOaVP",
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
        priceInCents: 5900,
        billingPeriod: EBillingPeriod.MONTHLY,
        externalProductId: "prod_Tuz22nh4bX0tdu",
        externalPriceId: "price_1Sx94cPUl9sTYXHRrtqzO6KO",
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
    {
        name: "Enterprise",
        description: "For large teams",
        priceInCents: 59000,
        billingPeriod: EBillingPeriod.YEARLY,
        externalProductId: "prod_Tuz22nh4bX0tdu",
        externalPriceId: "price_1SxCSwPUl9sTYXHRgo6TlQnM",
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
