import { PRICING_PLANS } from "../config/pricing.config";

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
