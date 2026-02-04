export interface IPricingPlan {
    name: string;
    description: string;
    priceInCents: number;
    billingPeriod: EBillingPeriod;
    externalProductId: string | null;
    externalPriceId: string | null;
    active: boolean;
    isFreeTier: boolean;
    maxProjects: number | null;
    features: string[];
}

export enum EBillingPeriod {
    MONTHLY = "monthly",
    YEARLY = "yearly",
}
