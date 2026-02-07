import { PRICING_PLANS } from '@shared/config/pricing.config'
import { EBillingPeriod, type IPricingPlan } from '@shared/types/pricing.types'

/**
 * Get the pricing plan for a given external price ID.
 * Falls back to the free tier if not found.
 */
export function getPlanByExternalPriceId(
  externalPriceId: string | null
): IPricingPlan {
  if (!externalPriceId) {
    return getFreeTierPlan()
  }

  const plan = PRICING_PLANS.find(p => p.externalPriceId === externalPriceId)

  return plan ?? getFreeTierPlan()
}

/**
 * Get the free tier plan.
 */
export function getFreeTierPlan(): IPricingPlan {
  const freePlan = PRICING_PLANS.find(p => p.isFreeTier)

  if (!freePlan) {
    throw new Error('Free tier plan not found in PRICING_PLANS')
  }

  return freePlan
}

/**
 * Format price with billing period (e.g., "$29.90/month" or "$290.00/year")
 */
export function formatPrice(plan: IPricingPlan): string {
  const price = (plan.priceInCents / 100).toFixed(2)
  const period =
    plan.billingPeriod === EBillingPeriod.MONTHLY ? 'month' : 'year'

  return `$${price}/${period}`
}
