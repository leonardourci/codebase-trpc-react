import { SubscriptionPricingGrid } from '@/components/billing/SubscriptionPricingGrid'
import { Header } from '@/components/layout/Header'
import { PRICING_PLANS } from '@shared/config/pricing.config'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'

export function PricingView() {
  const { isAuthenticated, user } = useAuth()
  const { openAuth } = useAuthModal()

  const handleButtonClick = () => {
    if (!isAuthenticated) {
      // Open signup modal for unauthenticated users
      openAuth('signup')
    } else {
      // Redirect authenticated users to billing page
      window.location.href = '/billing'
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
          <SubscriptionPricingGrid
            plans={PRICING_PLANS}
            buttonText="Get Started"
            onSubscribe={handleButtonClick}
            currentPlanExternalPriceId={isAuthenticated ? user?.currentProduct?.externalPriceId : undefined}
          />
        </div>
      </main>
    </div>
  )
}

export function PricingRoute() {
  return <PricingView />
}
