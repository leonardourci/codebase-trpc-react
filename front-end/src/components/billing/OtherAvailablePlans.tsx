import { Check } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { IPricingPlan } from '@shared/types/pricing.types'
import { EBillingPeriod } from '@shared/types/pricing.types'
import { formatPrice, getMonthlyEquivalent } from '@shared/utils/pricing.utils'

interface OtherAvailablePlansProps {
  plans: IPricingPlan[]
  currentProductExternalId?: string | null
}

export function OtherAvailablePlans({
  plans,
  currentProductExternalId,
}: OtherAvailablePlansProps) {
  const otherPlans = plans.filter(
    p => p.externalProductId !== currentProductExternalId
  )

  if (otherPlans.length === 0) {
    return null
  }

  return (
    <div className="pt-8 border-t">
      <h2 className="text-2xl font-bold mb-2">Other Available Plans</h2>
      <p className="text-muted-foreground mb-6">
        Want to upgrade or downgrade? Manage your subscription in the Stripe
        Portal above.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherPlans.map(plan => (
          <Card key={plan.name} className="opacity-75">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-1 mb-4">
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl font-bold">$</span>
                  <span className="text-4xl font-extrabold">
                    {plan.billingPeriod === EBillingPeriod.YEARLY &&
                    !plan.isFreeTier
                      ? formatPrice({ priceInCents: getMonthlyEquivalent({ yearlyPriceInCents: plan.priceInCents }) })
                      : formatPrice({ priceInCents: plan.priceInCents })}
                  </span>
                  <span className="text-muted-foreground ml-1">/mo</span>
                </div>
                {plan.billingPeriod === EBillingPeriod.YEARLY &&
                  !plan.isFreeTier && (
                    <p className="text-sm text-muted-foreground">
                      ${formatPrice({ priceInCents: plan.priceInCents })} billed yearly
                    </p>
                  )}
              </div>
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-2 text-left text-sm">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center text-muted-foreground"
                    >
                      <Check className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
