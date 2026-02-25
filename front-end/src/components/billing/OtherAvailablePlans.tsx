import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export function OtherAvailablePlans() {
  return (
    <div className="pt-8 border-t">
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">
          Want to change your plan?
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          View all available plans and compare features
        </p>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors"
        >
          View all plans
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
