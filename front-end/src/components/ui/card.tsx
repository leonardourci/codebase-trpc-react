import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/* eslint-disable-next-line */
export interface CardProps extends ComponentProps<"div"> { }

export function Card({ className, ref, ...props }: CardProps) {
    return (
        <div
            ref={ref}
            data-slot="card"
            className={cn(
                "rounded-xl border border-border/50 bg-card text-card-foreground shadow-lg shadow-black/5 transition-shadow hover:shadow-xl hover:shadow-black/10",
                className
            )}
            {...props}
        />
    )
}

export function CardHeader({ className, ref, ...props }: ComponentProps<"div">) {
    return (
        <div
            ref={ref}
            data-slot="card-header"
            className={cn("flex flex-col space-y-1.5 p-6 md:p-8", className)}
            {...props}
        />
    )
}

export function CardTitle({ className, ref, ...props }: ComponentProps<"h3">) {
    return (
        <h3
            ref={ref}
            data-slot="card-title"
            className={cn(
                "text-xl md:text-2xl font-semibold leading-none tracking-tight",
                className
            )}
            {...props}
        />
    )
}

export function CardDescription({ className, ref, ...props }: ComponentProps<"p">) {
    return (
        <p
            ref={ref}
            data-slot="card-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
}

export function CardContent({ className, ref, ...props }: ComponentProps<"div">) {
    return (
        <div
            ref={ref}
            data-slot="card-content"
            className={cn("p-6 pt-0 md:p-8 md:pt-0", className)}
            {...props}
        />
    )
}

export function CardFooter({ className, ref, ...props }: ComponentProps<"div">) {
    return (
        <div
            ref={ref}
            data-slot="card-footer"
            className={cn("flex items-center p-6 pt-0", className)}
            {...props}
        />
    )
}