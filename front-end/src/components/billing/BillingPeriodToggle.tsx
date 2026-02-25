import { EBillingPeriod } from '@shared/types/pricing.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BillingPeriodToggleProps {
  selectedPeriod: EBillingPeriod
  onPeriodChange: (period: EBillingPeriod) => void
}

export function BillingPeriodToggle({
  selectedPeriod,
  onPeriodChange,
}: BillingPeriodToggleProps) {
  return (
    <div className="flex items-center justify-center mb-6">
      <div className="inline-flex items-center rounded-lg border border-input bg-background p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPeriodChange(EBillingPeriod.MONTHLY)}
          className={cn(
            'rounded-md px-6 transition-colors',
            selectedPeriod === EBillingPeriod.MONTHLY
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-transparent'
          )}
        >
          Monthly
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPeriodChange(EBillingPeriod.YEARLY)}
          className={cn(
            'rounded-md px-6 transition-colors',
            selectedPeriod === EBillingPeriod.YEARLY
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-transparent'
          )}
        >
          Yearly
          <span className="ml-2 text-xs font-semibold bg-green-500/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
            Save 17%
          </span>
        </Button>
      </div>
    </div>
  )
}
