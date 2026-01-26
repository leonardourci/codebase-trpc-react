import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'

interface PricingCardProps {
    name: string
    description: string
    price: number
    currency: string
    features: string[]
    popular?: boolean
}

export function PricingCard({ name, description, price, currency, features, popular }: PricingCardProps) {
    const pricingCardVariants = cva(
        "w-full flex flex-col relative overflow-hidden transition-all duration-300",
        {
            variants: {
                popular: {
                    true: "border-primary/50 shadow-xl scale-[1.02] md:scale-105",
                    false: "border-border/50 shadow-lg",
                },
            },
            defaultVariants: {
                popular: false,
            },
        }
    )
    return (
        <div data-slot="pricing-card">
            <Card className={cn(pricingCardVariants({ popular: !!popular }))}>
                {popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                        POPULAR
                    </div>
                )}
                <CardHeader className="text-center pb-6 pt-8 md:pt-10">
                    <CardTitle className="text-xl md:text-2xl font-bold">{name}</CardTitle>
                    <CardDescription className="text-sm md:text-base mt-2">{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col items-center">
                    <div className="flex items-baseline justify-center mb-8">
                        <span className="text-3xl md:text-4xl font-bold">{currency === 'USD' ? '$' : currency}</span>
                        <span className="text-5xl md:text-6xl font-extrabold tracking-tight">{price}</span>
                        <span className="text-muted-foreground ml-1 text-lg">/mo</span>
                    </div>
                    <ul className="space-y-3 w-full text-left">
                        {features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm md:text-base text-muted-foreground">
                                <Check className="h-5 w-5 mr-3 text-primary flex-shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter className="pt-6 pb-8 md:pb-10">
                    <Button className={cn("w-full transition-all duration-300", popular ? "shadow-md hover:shadow-lg" : "")} size="lg">
                        Get Started
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
