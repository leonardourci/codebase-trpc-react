import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BillingPageHeader } from '@/components/billing/BillingPageHeader'
import { EmailVerificationWarning } from '@/components/billing/EmailVerificationWarning'
import { EmailVerificationDialog } from '@/components/billing/EmailVerificationDialog'
import { CurrentSubscriptionCard } from '@/components/billing/CurrentSubscriptionCard'
import { SubscriptionPricingGrid } from '@/components/billing/SubscriptionPricingGrid'
import { OtherAvailablePlans } from '@/components/billing/OtherAvailablePlans'
import { BillingPeriodToggle } from '@/components/billing/BillingPeriodToggle'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { PRICING_PLANS } from '@shared/config/pricing.config'
import { EBillingPeriod } from '@shared/types/pricing.types'
import { getPlanByExternalPriceId } from '@/utils/pricing'

export function BillingPage() {
  const { user, refreshUser } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const [showVerificationError, setShowVerificationError] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<EBillingPeriod>(
    EBillingPeriod.YEARLY
  )

  const {
    data: billingData,
    isLoading,
    refetch: refetchBilling,
  } = trpc.billing.getUserBilling.useQuery(undefined, {
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  // After a successful checkout, Stripe redirects back with ?success=true.
  // Refresh user profile and billing data so the page reflects the new subscription.
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      refreshUser()
      refetchBilling()
      searchParams.delete('success')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams])
  const createPortalSession =
    trpc.billing.createCustomerPortalSession.useMutation()
  const createCheckoutSession = trpc.billing.createCheckoutSession.useMutation()
  const resendMutation = trpc.auth.resendVerificationEmail.useMutation()

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true)

    try {
      const result = await createPortalSession.mutateAsync({
        returnUrl: `${window.location.origin}/billing`,
      })

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to access billing portal'

      if (
        error?.data?.httpStatus === 403 &&
        errorMessage.includes('verify your email')
      ) {
        // Backend rejected the request because email is not verified
        // This means the frontend state is out of sync (possibly manipulated)
        // Re-fetch user data from the database to sync frontend with backend state
        try {
          await refreshUser()
        } catch (refreshError) {
          console.error('Failed to refresh user data:', refreshError)
        }

        setShowVerificationError(true)
      } else {
        alert(errorMessage)
      }

      setIsLoadingPortal(false)
    }
  }

  const handleSubscribe = async (priceId: string) => {
    if (!user?.emailVerified) {
      setShowVerificationError(true)
      return
    }

    setCheckoutLoading(priceId)

    try {
      const result = await createCheckoutSession.mutateAsync({
        priceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing`,
      })

      if (result.url) {
        window.location.href = result.url
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create checkout session'
      alert(errorMessage)
      setCheckoutLoading(null)
    }
  }

  const handleResendVerificationEmail = () => {
    resendMutation.mutate(undefined, {
      onSuccess: () => {
        alert('Verification email sent! Please check your inbox.')
        setShowVerificationError(false)
      },
      onError: () => {
        alert('Failed to send verification email. Please try again.')
      },
    })
  }

  if (isLoading) {
    return (
      <AppLayout showSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" text="Loading billing information..." />
        </div>
      </AppLayout>
    )
  }

  const hasSubscription = billingData?.hasSubscription
  const billing = billingData?.billing

  // Derive current plan from billing data (fresh from DB)
  const currentPlan = getPlanByExternalPriceId(
    billingData?.externalPriceId ?? null
  )

  // If billing says there's an active subscription, trust that over the auth context
  const isOnFreeTier = !hasSubscription

  const displayedPlans = PRICING_PLANS.filter(
    plan => plan.isFreeTier || plan.billingPeriod === selectedPeriod
  )

  return (
    <AppLayout showSidebar>
      <div className="space-y-6">
        <BillingPageHeader hasSubscription={hasSubscription && !isOnFreeTier} />

        {!user?.emailVerified && (
          <EmailVerificationWarning
            onResendEmail={handleResendVerificationEmail}
            isLoading={resendMutation.isPending}
          />
        )}

        {hasSubscription && billing && !isOnFreeTier && (
          <CurrentSubscriptionCard
            billing={billing}
            plan={currentPlan}
            onManageSubscription={handleManageSubscription}
            isLoading={isLoadingPortal}
          />
        )}

        {isOnFreeTier && (
          <>
            {billing?.externalCustomerId && (
              <div className="border rounded-lg p-4 bg-card flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  View your past invoices, payment methods and billing history
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={isLoadingPortal}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingPortal ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Billing History'
                  )}
                </Button>
              </div>
            )}
            <BillingPeriodToggle
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />
            <SubscriptionPricingGrid
              plans={displayedPlans}
              allPlans={PRICING_PLANS}
              onSubscribe={handleSubscribe}
              checkoutLoading={checkoutLoading}
              isEmailVerified={!!user?.emailVerified}
              currentPlanExternalPriceId={
                hasSubscription ? currentPlan.externalPriceId : null
              }
            />
          </>
        )}
      </div>

      <EmailVerificationDialog
        open={showVerificationError}
        onOpenChange={setShowVerificationError}
        onResendEmail={handleResendVerificationEmail}
        isLoading={resendMutation.isPending}
      />
    </AppLayout>
  )
}
