import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EmailVerificationWarningProps {
    onResendEmail: () => void
    isLoading: boolean
}

export function EmailVerificationWarning({ onResendEmail, isLoading }: EmailVerificationWarningProps) {
    return (
        <Card className="border-warning bg-warning/5">
            <div className="p-6 md:p-8">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                    <div>
                        <p className="font-medium text-warning">Email Verification Required</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            You need to verify your email before you can subscribe to a plan.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={onResendEmail}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    )
}
