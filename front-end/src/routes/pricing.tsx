import { PricingCard } from '@/components/pricing/PricingCard'
import { Header } from '@/components/layout/Header'
import type { IProduct } from '@/types/product'
import { PRICING_PLANS } from '@/data/pricing'

export interface PricingPlan {
    id: string
    name: string
    description: string
    price: number
    currency: string
    features: string[]
}

export function transformProduct(p: IProduct): PricingPlan {
    return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.priceInCents / 100,
        currency: p.currency || 'USD',
        features: [],
    }
}

export function PricingView({ products }: { products: PricingPlan[] }) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background flex flex-col">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-6xl">
                    {products.map((p, index) => (
                        <PricingCard
                            key={p.id}
                            name={p.name}
                            description={p.description}
                            price={p.price}
                            currency={p.currency}
                            features={p.features}
                            popular={index === 1}
                        />
                    ))}
                </div>
            </main>
        </div>
    )
}

export function PricingRoute() {
    const transformedProducts = PRICING_PLANS?.map(transformProduct) || []

    return <PricingView products={transformedProducts} />
}
