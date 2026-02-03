export interface IPricingPlan {
    name: string;
    description: string;
    priceInCents: number;
    externalProductId: string | null;
    externalPriceId: string | null;
    active: boolean;
    isFreeTier: boolean;
    maxProjects: number | null;
    features: string[];
}
