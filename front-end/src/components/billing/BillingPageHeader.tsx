interface BillingPageHeaderProps {
    hasSubscription: boolean
}

export function BillingPageHeader({ hasSubscription }: BillingPageHeaderProps) {
    return (
        <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-semibold mb-1">
                {hasSubscription ? 'Subscription Management' : 'Choose Your Plan'}
            </h1>
            <p className="text-sm text-muted-foreground">
                {hasSubscription
                    ? 'Manage your subscription and billing details'
                    : 'Select a plan to get started with our platform'}
            </p>
        </div>
    )
}
