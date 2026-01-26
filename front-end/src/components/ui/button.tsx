import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg",
                outline:
                    "border border-input/50 bg-background hover:bg-accent hover:text-accent-foreground hover:border-input shadow-sm hover:shadow-md",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover:shadow-md",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-11 px-6 py-2.5 min-h-[44px]",
                sm: "h-9 rounded-lg px-4 min-h-[36px]",
                lg: "h-12 rounded-lg px-8 text-base min-h-[48px]",
                icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
}

export function Button({
    className,
    variant,
    size,
    disabled,
    ref,
    ...props
}: ButtonProps) {
    return (
        <button
            ref={ref}
            data-slot="button"
            data-disabled={disabled ? '' : undefined}
            className={cn(buttonVariants({ variant, size }), className)}
            disabled={disabled}
            {...props}
        />
    )
}
