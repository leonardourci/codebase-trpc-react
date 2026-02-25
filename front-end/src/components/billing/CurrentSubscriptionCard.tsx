import { CreditCard, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import type { Billing, Product } from '@/lib/trpc-types'

interface CurrentSubscriptionCardProps {
    billing: Billing
    product: Product
    onManageSubscription: () => void
    isLoading: boolean
}

export function CurrentSubscriptionCard({
    billing,
    product,
    onManageSubscription,
    isLoading
}: CurrentSubscriptionCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Subscription
                </CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-sm text-muted-foreground">Plan</p>
                        <p className="font-medium text-lg">{product.name}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-medium text-lg">
                            ${(product.priceInCents / 100).toFixed(2)}/month
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">
                            <span
                                className={cn(
                                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                    billing.status === 'active'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : billing.status === 'past_due'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                )}
                            >
                                {billing.status}
                            </span>
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Next Billing Date
                        </p>
                        <p className="font-medium">
                            {new Date(billing.expiresAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    onClick={onManageSubscription}
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                >
                    {isLoading ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage in Stripe Portal
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    )
}
