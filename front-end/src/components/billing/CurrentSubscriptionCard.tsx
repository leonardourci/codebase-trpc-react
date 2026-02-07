import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import type { IBilling } from '@/types'
import type { IPricingPlan } from '@shared/types/pricing.types'
import { formatPrice } from '@/utils/pricing'

interface CurrentSubscriptionCardProps {
  billing: IBilling
  plan: IPricingPlan
  onManageSubscription: () => void
  isLoading: boolean
}

export function CurrentSubscriptionCard({
  billing,
  plan,
  onManageSubscription,
  isLoading,
}: CurrentSubscriptionCardProps) {
  return (
    <div className="border rounded-lg p-6 bg-card">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-1">Current Subscription</h2>
          <p className="text-sm text-muted-foreground">
            Your active plan details
          </p>
        </div>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
            billing.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : billing.status === 'past_due'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {billing.status}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Plan</p>
          <p className="text-xl font-semibold">{plan.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Price</p>
          <p className="text-xl font-semibold">{formatPrice(plan)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Next Billing Date
          </p>
          <p className="text-xl font-semibold">
            {new Date(billing.expiresAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      <Button
        onClick={onManageSubscription}
        disabled={isLoading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Loading...
          </>
        ) : (
          'Manage Subscription'
        )}
      </Button>
    </div>
  )
}
