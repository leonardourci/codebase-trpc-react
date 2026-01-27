import { useState } from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

interface GoogleAuthButtonProps extends Omit<ComponentProps<'div'>, 'onClick'> {
    onSuccess?: () => void
    onError?: (error: unknown) => void
}

export function GoogleAuthButton({
    className,
    onSuccess,
    onError,
    ref,
    ...props
}: GoogleAuthButtonProps) {
    const { googleLogin } = useAuth()
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const handleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) {
            onError?.('No credential received from Google')
            return
        }

        setIsLoading(true)
        try {
            await googleLogin(credentialResponse.credential)
            onSuccess?.()
            navigate('/dashboard')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Google sign-in failed'
            onError?.(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleError = () => {
        onError?.('Google sign-in failed. Please try again.')
    }

    if (isLoading) {
        return (
            <div
                ref={ref}
                className={cn('w-full', className)}
                data-slot="google-auth-button"
                data-loading=""
                {...props}
            >
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled
                >
                    <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Signing in...
                    </div>
                </Button>
            </div>
        )
    }

    return (
        <div
            ref={ref}
            className={cn('w-full [&>div]:w-full [&>div>div]:w-full', className)}
            data-slot="google-auth-button"
            {...props}
        >
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
                width="100%"
            />
        </div>
    )
}