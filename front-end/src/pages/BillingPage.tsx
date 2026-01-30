import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { BillingPageHeader } from '@/components/billing/BillingPageHeader'
import { EmailVerificationWarning } from '@/components/billing/EmailVerificationWarning'
import { EmailVerificationDialog } from '@/components/billing/EmailVerificationDialog'
import { CurrentSubscriptionCard } from '@/components/billing/CurrentSubscriptionCard'
import { SubscriptionPricingGrid } from '@/components/billing/SubscriptionPricingGrid'
import { OtherAvailablePlans } from '@/components/billing/OtherAvailablePlans'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/hooks/useAuth'
import { PRICING_PLANS } from '@/data/pricing'

export function BillingPage() {
    const { user } = useAuth()
    const [isLoadingPortal, setIsLoadingPortal] = useState(false)
    const [showVerificationError, setShowVerificationError] = useState(false)
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

    const { data: billingData, isLoading } = trpc.billing.getUserBilling.useQuery()
    const createPortalSession = trpc.billing.createCustomerPortalSession.useMutation()
    const createCheckoutSession = trpc.billing.createCheckoutSession.useMutation()
    const resendMutation = trpc.auth.resendVerificationEmail.useMutation()

    const handleManageSubscription = async () => {
        setIsLoadingPortal(true)

        try {
            const result = await createPortalSession.mutateAsync({
                returnUrl: `${window.location.origin}/billing`
            })

            if (result.url) {
                window.location.href = result.url
            }
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to access billing portal'

            if (error?.data?.httpStatus === 403 && errorMessage.includes('verify your email')) {
                setShowVerificationError(true)
            } else {
                alert(errorMessage)
            }

            setIsLoadingPortal(false)
        }
    }

    const handleSubscribe = async (productId: string) => {
        if (!user?.emailVerified) {
            setShowVerificationError(true)
            return
        }

        setCheckoutLoading(productId)

        try {
            const result = await createCheckoutSession.mutateAsync({
                productId,
                successUrl: `${window.location.origin}/billing?success=true`,
                cancelUrl: `${window.location.origin}/billing`
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
            }
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
    const product = billingData?.product

    return (
        <AppLayout showSidebar>
            <div className="space-y-8">
                <BillingPageHeader hasSubscription={!!hasSubscription} />

                {!user?.emailVerified && (
                    <EmailVerificationWarning
                        onResendEmail={handleResendVerificationEmail}
                        isLoading={resendMutation.isPending}
                    />
                )}

                {hasSubscription && billing && product && (
                    <CurrentSubscriptionCard
                        billing={billing}
                        product={product}
                        onManageSubscription={handleManageSubscription}
                        isLoading={isLoadingPortal}
                    />
                )}

                {!hasSubscription && (
                    <SubscriptionPricingGrid
                        plans={PRICING_PLANS}
                        onSubscribe={handleSubscribe}
                        checkoutLoading={checkoutLoading}
                        isEmailVerified={!!user?.emailVerified}
                    />
                )}

                {hasSubscription && (
                    <OtherAvailablePlans
                        plans={PRICING_PLANS}
                        currentProductId={product?.id}
                    />
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
