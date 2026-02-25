import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { IPricingPlan } from '@shared/types/pricing.types'
import { EBillingPeriod } from '@shared/types/pricing.types'
import { formatPrice, getMonthlyEquivalent } from '@shared/utils/pricing.utils'

interface SubscriptionPricingGridProps {
  plans: IPricingPlan[]
  allPlans?: IPricingPlan[]
  onSubscribe?: (priceId: string) => void
  onFreeTierClick?: () => void
  checkoutLoading?: string | null
  isEmailVerified?: boolean
  buttonText?: string | ((plan: IPricingPlan) => string)
  currentPlanExternalPriceId?: string | null
}

export function SubscriptionPricingGrid({
  plans,
  allPlans,
  onSubscribe,
  onFreeTierClick,
  checkoutLoading = null,
  isEmailVerified = true,
  buttonText = 'Subscribe',
  currentPlanExternalPriceId,
}: SubscriptionPricingGridProps) {
  const isInteractive = !!onSubscribe

  const isCurrentPlan = (plan: IPricingPlan): boolean => {
    // If no currentPlanExternalPriceId provided, no plan is current (unauthenticated)
    if (currentPlanExternalPriceId === undefined) {
      return false
    }

    // Match by externalPriceId
    // Both null = free tier match
    return plan.externalPriceId === currentPlanExternalPriceId
  }

  const getButtonTextForPlan = (plan: IPricingPlan): string => {
    if (typeof buttonText === 'function') {
      return buttonText(plan)
    }
    return buttonText
  }

  const getMonthlyPlanPrice = (yearlyPlan: IPricingPlan): number | null => {
    if (!allPlans || yearlyPlan.billingPeriod !== EBillingPeriod.YEARLY) {
      return null
    }
    // Find matching monthly plan by product name
    const monthlyPlan = allPlans.find(
      p =>
        p.name === yearlyPlan.name && p.billingPeriod === EBillingPeriod.MONTHLY
    )
    return monthlyPlan?.priceInCents ?? null
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card
            key={plan.externalPriceId ?? plan.name}
            className={cn(
              'relative overflow-hidden transition-all duration-300 flex flex-col',
              index === 1
                ? 'border-primary/50 shadow-xl'
                : 'border-border/50 shadow-lg'
            )}
          >
            {index === 1 && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                POPULAR
              </div>
            )}
            <CardHeader className="text-center pb-6 pt-8">
              <CardTitle className="text-xl md:text-2xl font-bold">
                {plan.name}
              </CardTitle>
              <CardDescription className="text-sm md:text-base mt-2">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-1">
                {plan.billingPeriod === EBillingPeriod.YEARLY &&
                  !plan.isFreeTier &&
                  (() => {
                    const monthlyPlanPrice = getMonthlyPlanPrice(plan)

                    return monthlyPlanPrice ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground line-through mb-1">
                        <span>
                          ${formatPrice({ priceInCents: monthlyPlanPrice })}/mo
                        </span>
                      </div>
                    ) : null
                  })()}
                <div className="flex items-baseline justify-center">
                  <span className="text-3xl md:text-4xl font-bold">$</span>
                  <span className="text-5xl md:text-6xl font-extrabold tracking-tight">
                    {plan.billingPeriod === EBillingPeriod.YEARLY &&
                    !plan.isFreeTier
                      ? formatPrice({
                          priceInCents: getMonthlyEquivalent({
                            yearlyPriceInCents: plan.priceInCents,
                          }),
                        })
                      : formatPrice({ priceInCents: plan.priceInCents })}
                  </span>
                  <span className="text-muted-foreground ml-1 text-lg">
                    /mo
                  </span>
                </div>
                {plan.billingPeriod === EBillingPeriod.YEARLY &&
                  !plan.isFreeTier &&
                  (() => {
                    const monthlyPlanPrice = getMonthlyPlanPrice(plan)
                    const yearlySavings = monthlyPlanPrice
                      ? Math.max(0, monthlyPlanPrice * 12 - plan.priceInCents)
                      : 0

                    return (
                      <>
                        {monthlyPlanPrice && yearlySavings > 0 && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            Save ${formatPrice({ priceInCents: yearlySavings })}
                            /year
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          ${formatPrice({ priceInCents: plan.priceInCents })}{' '}
                          billed yearly
                        </p>
                      </>
                    )
                  })()}
              </div>
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-center text-sm text-muted-foreground"
                    >
                      <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
            <CardFooter className="mt-auto">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <div className="w-full">
                    <Button
                      onClick={
                        isInteractive
                          ? plan.externalPriceId
                            ? () => onSubscribe(plan.externalPriceId!)
                            : onFreeTierClick
                          : undefined
                      }
                      disabled={
                        isInteractive &&
                        ((!!checkoutLoading &&
                          checkoutLoading === plan.externalPriceId) ||
                          !isEmailVerified ||
                          isCurrentPlan(plan))
                      }
                      className={cn(
                        'w-full transition-all duration-300',
                        index === 1 ? 'shadow-md hover:shadow-lg' : '',
                        isInteractive &&
                          ((!!checkoutLoading &&
                            checkoutLoading === plan.externalPriceId) ||
                            !isEmailVerified ||
                            isCurrentPlan(plan))
                          ? 'cursor-not-allowed'
                          : 'cursor-pointer'
                      )}
                      size="lg"
                    >
                      {isInteractive &&
                      !!checkoutLoading &&
                      checkoutLoading === plan.externalPriceId ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Loading...
                        </>
                      ) : isCurrentPlan(plan) ? (
                        'Current Plan'
                      ) : (
                        getButtonTextForPlan(plan)
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {isInteractive && !isEmailVerified && (
                  <TooltipContent>
                    <p>You must verify your email before subscribing</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </CardFooter>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  )
}
