import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { userService } from '@/services/user.service'
import { useResendTimer } from '@/hooks/useResendTimer'
import { Mail, CheckCircle } from 'lucide-react'

interface ChangeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  currentEmail: string
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  onSuccess,
  currentEmail,
}: ChangeEmailDialogProps) {
  const [newEmail, setNewEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const { secondsRemaining, canResend, resetTimer } = useResendTimer({
    initialSeconds: 60,
    isActive: showCodeInput
  })

  const resetDialog = () => {
    setNewEmail('')
    setVerificationCode('')
    setError(null)
    setIsLoading(false)
    setShowCodeInput(false)
    setShowSuccess(false)
    resetTimer()
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  const handleRequestEmailChange = async () => {
    setError(null)

    if (!newEmail || !newEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (newEmail === currentEmail) {
      setError('New email must be different from current email')
      return
    }

    setIsLoading(true)

    try {
      await userService.requestEmailChange(newEmail)
      setShowCodeInput(true)
      resetTimer()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send verification code'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setError(null)

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      await userService.verifyEmailChange(verificationCode)
      setShowSuccess(true)
      setTimeout(() => {
        handleClose()
        onSuccess()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError(null)
    setIsLoading(true)

    try {
      await userService.requestEmailChange(newEmail)
      resetTimer()
      setVerificationCode('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (value: string) => {
    // Only allow digits, max 6 characters
    const digits = value.replace(/\D/g, '').slice(0, 6)
    setVerificationCode(digits)
    setError(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {showSuccess ? (
          <>
            <DialogHeader className="flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
              <DialogTitle className="text-center">Email Updated!</DialogTitle>
              <DialogDescription className="text-center">
                Your email has been successfully changed to{' '}
                <strong>{newEmail}</strong>
              </DialogDescription>
            </DialogHeader>
          </>
        ) : !showCodeInput ? (
          <>
            <DialogHeader className="flex flex-col justify-center">
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Change Email Address
              </DialogTitle>
              <DialogDescription className="text-center">
                Enter your new email address. We'll send you a verification
                code.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="current-email">Current Email</Label>
                <Input
                  id="current-email"
                  type="email"
                  value={currentEmail}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-email">New Email Address</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleRequestEmailChange()
                    }
                  }}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleRequestEmailChange} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex flex-col">
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Enter Verification Code
              </DialogTitle>
              <DialogDescription className="text-center">
                Enter the 6-digit code sent to <strong>{newEmail}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={e => handleCodeChange(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  className="text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
              </div>

              <div className="text-sm text-muted-foreground text-center">
                {canResend ? (
                  <button
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Resend code
                  </button>
                ) : (
                  <span>Resend code in {secondsRemaining}s</span>
                )}
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
