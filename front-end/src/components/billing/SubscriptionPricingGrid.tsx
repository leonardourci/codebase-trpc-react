import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import type { IProduct } from '@/types'

interface SubscriptionPricingGridProps {
    plans: IProduct[]
    onSubscribe: (productId: string) => void
    checkoutLoading: string | null
    isEmailVerified: boolean
}

export function SubscriptionPricingGrid({
    plans,
    onSubscribe,
    checkoutLoading,
    isEmailVerified
}: SubscriptionPricingGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
                <Card
                    key={plan.id}
                    className={cn(
                        'relative overflow-hidden transition-all duration-300',
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
                        <div className="flex items-baseline justify-center">
                            <span className="text-3xl md:text-4xl font-bold">$</span>
                            <span className="text-5xl md:text-6xl font-extrabold tracking-tight">
                                {(plan.priceInCents / 100).toFixed(0)}
                            </span>
                            <span className="text-muted-foreground ml-1 text-lg">/mo</span>
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
                    <CardFooter>
                        <Button
                            onClick={() => onSubscribe(plan.id)}
                            disabled={checkoutLoading === plan.id || !isEmailVerified}
                            className={cn(
                                'w-full transition-all duration-300',
                                index === 1 ? 'shadow-md hover:shadow-lg' : ''
                            )}
                            size="lg"
                        >
                            {checkoutLoading === plan.id ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Loading...
                                </>
                            ) : (
                                'Subscribe'
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
