import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/* eslint-disable-next-line */
export interface InputProps extends ComponentProps<"input"> { }

export function Input({ className, type, ref, ...props }: InputProps) {
    return (
        <input
            type={type}
            ref={ref}
            data-slot="input"
            className={cn(
                "flex h-11 w-full rounded-lg border border-input/50 bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 shadow-sm focus-visible:shadow-md",
                className
            )}
            {...props}
        />
    )
}