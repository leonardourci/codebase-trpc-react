import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface EmailVerificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onResendEmail: () => void
    isLoading: boolean
}

export function EmailVerificationDialog({
    open,
    onOpenChange,
    onResendEmail,
    isLoading
}: EmailVerificationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Email Verification Required</DialogTitle>
                    <DialogDescription>
                        Please verify your email address before making a purchase.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        onClick={onResendEmail}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Sending...' : 'Resend Verification Email'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
