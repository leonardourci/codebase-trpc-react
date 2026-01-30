interface BillingPageHeaderProps {
    hasSubscription: boolean
}

export function BillingPageHeader({ hasSubscription }: BillingPageHeaderProps) {
    return (
        <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {hasSubscription ? 'Subscription Management' : 'Choose Your Plan'}
            </h1>
            <p className="text-muted-foreground mt-2">
                {hasSubscription
                    ? 'Manage your subscription and billing details'
                    : 'Select a plan to get started with our platform'}
            </p>
        </div>
    )
}
