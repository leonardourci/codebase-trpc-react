import { useState } from 'react'
import { SubscriptionPricingGrid } from '@/components/billing/SubscriptionPricingGrid'
import { Header } from '@/components/layout/Header'
import { PRICING_PLANS } from '@shared/config/pricing.config'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { BillingPeriodToggle } from '@/components/billing/BillingPeriodToggle'
import { EBillingPeriod, type IPricingPlan } from '@shared/types/pricing.types'
import { trpc } from '@/lib/trpc'

export function PricingView() {
  const { isAuthenticated } = useAuth()
  const { openAuth } = useAuthModal()
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)

  const [selectedPeriod, setSelectedPeriod] = useState<EBillingPeriod>(
    EBillingPeriod.YEARLY
  )

  const { data: billingData } = trpc.billing.getUserBilling.useQuery(
    undefined,
    { enabled: isAuthenticated }
  )
  const createPortalSession =
    trpc.billing.createCustomerPortalSession.useMutation()

  const displayedPlans = PRICING_PLANS.filter(
    plan => plan.isFreeTier || plan.billingPeriod === selectedPeriod
  )

  // Authenticated users: use externalPriceId from billing (null = free tier, matches free plan's null).
  // Unauthenticated: billingData is undefined, so no plan is marked as current.
  const currentPlanPriceId = billingData
    ? (billingData.externalPriceId ?? null)
    : undefined

  const getButtonText = (plan: IPricingPlan): string => {
    if (!isAuthenticated) return 'Get Started'
    return 'Subscribe'
  }

  const handleButtonClick = async (priceId: string) => {
    if (!isAuthenticated) {
      // Open signup modal for unauthenticated users
      openAuth('signup')
      return
    }

    // For authenticated users, open Stripe Portal to manage subscription
    setIsLoadingPortal(true)
    try {
      const result = await createPortalSession.mutateAsync({
        returnUrl: `${window.location.origin}/pricing`,
      })

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to access billing portal'
      alert(errorMessage)
      setIsLoadingPortal(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col pt-16 md:pt-20">
      <Header />
      <main className="flex-1 flex flex-col items-center py-12 md:py-20 px-4">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            Choose the plan that's right for you. No hidden fees.
          </p>
        </div>
        <div className="w-full max-w-6xl">
          <BillingPeriodToggle
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <SubscriptionPricingGrid
            plans={displayedPlans}
            allPlans={PRICING_PLANS}
            buttonText={getButtonText}
            onSubscribe={handleButtonClick}
            checkoutLoading={isLoadingPortal ? 'loading' : null}
            currentPlanExternalPriceId={currentPlanPriceId}
          />
        </div>
      </main>
    </div>
  )
}

export function PricingRoute() {
  return <PricingView />
}
