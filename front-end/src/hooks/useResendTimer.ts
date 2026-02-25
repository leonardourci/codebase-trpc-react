import { useState, useEffect } from 'react'

interface UseResendTimerOptions {
  initialSeconds: number
  isActive: boolean
}

interface UseResendTimerReturn {
  secondsRemaining: number
  canResend: boolean
  resetTimer: () => void
}

export function useResendTimer({ initialSeconds, isActive }: UseResendTimerOptions): UseResendTimerReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (isActive && !canResend && secondsRemaining > 0) {
      const interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isActive, canResend, secondsRemaining])

  const resetTimer = () => {
    setSecondsRemaining(initialSeconds)
    setCanResend(false)
  }

  return { secondsRemaining, canResend, resetTimer }
}
