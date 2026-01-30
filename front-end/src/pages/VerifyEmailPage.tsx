import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { trpc } from '../lib/trpc'
import { LoadingSpinner } from '../components/ui/loading-spinner'
import { Button } from '../components/ui/button'
import { getUser, setUser } from '../utils/auth'

type VerificationState = 'verifying' | 'success' | 'error' | 'already-verified'

export function VerifyEmailPage() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const [state, setState] = useState<VerificationState>('verifying')
	const [errorMessage, setErrorMessage] = useState<string>('')

	const verifyMutation = trpc.auth.verifyEmail.useMutation()
	const resendMutation = trpc.auth.resendVerificationEmail.useMutation()

	useEffect(() => {
		const token = searchParams.get('token')

		if (!token) {
			setState('error')
			setErrorMessage('No verification token provided')
			return
		}

		verifyMutation.mutate(
			{ token },
			{
				onSuccess: () => {
					const currentUser = getUser()
					if (currentUser) {
						setUser({
							...currentUser,
							emailVerified: true
						})
					}

					setState('success')
					setTimeout(() => {
						navigate('/dashboard')
					}, 3000)
				},
				onError: (error) => {
					if (error.message.includes('already verified')) {
						setState('already-verified')
					} else {
						setState('error')
						setErrorMessage(error.message || 'Failed to verify email')
					}
				}
			}
		)
	}, [searchParams])

	const handleResend = () => {
		resendMutation.mutate(undefined, {
			onSuccess: () => {
				setErrorMessage('Verification email sent! Please check your inbox.')
			},
			onError: (error) => {
				setErrorMessage(error.message || 'Failed to send verification email')
			}
		})
	}

	if (state === 'verifying') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<LoadingSpinner size="lg" />
					<p className="mt-4 text-gray-600">Verifying your email...</p>
				</div>
			</div>
		)
	}

	if (state === 'success') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
					<div className="text-green-500 text-6xl mb-4">✓</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						Email Verified!
					</h1>
					<p className="text-gray-600 mb-4">
						Your email has been successfully verified. Redirecting to dashboard...
					</p>
				</div>
			</div>
		)
	}

	if (state === 'already-verified') {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
					<div className="text-blue-500 text-6xl mb-4">ℹ</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">
						Already Verified
					</h1>
					<p className="text-gray-600 mb-6">
						Your email is already verified. You have full access to all features.
					</p>
					<Button onClick={() => navigate('/dashboard')}>
						Go to Dashboard
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
				<div className="text-red-500 text-6xl mb-4">✕</div>
				<h1 className="text-2xl font-bold text-gray-900 mb-2">
					Verification Failed
				</h1>
				<p className="text-gray-600 mb-6">{errorMessage}</p>
				<div className="space-y-3">
					<Button
						onClick={handleResend}
						disabled={resendMutation.isPending}
						className="w-full"
					>
						{resendMutation.isPending ? 'Sending...' : 'Resend Verification Email'}
					</Button>
					<Button
						onClick={() => navigate('/dashboard')}
						variant="outline"
						className="w-full"
					>
						Go to Dashboard
					</Button>
				</div>
			</div>
		</div>
	)
}
