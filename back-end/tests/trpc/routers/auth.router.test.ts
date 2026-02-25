// Mock auth service
const mockAuthenticateUser = jest.fn()
const mockRegisterUser = jest.fn()
const mockRefreshAccessToken = jest.fn()
const mockRevokeUserRefreshToken = jest.fn()
const mockAuthenticateWithGoogle = jest.fn()
const mockVerifyUserEmail = jest.fn()
const mockResendVerificationEmail = jest.fn()
const mockForgotPassword = jest.fn()
const mockResetPassword = jest.fn()

jest.mock('../../../src/services/auth.service', () => ({
	authenticateUser: (...args: any[]) => mockAuthenticateUser(...args),
	registerUser: (...args: any[]) => mockRegisterUser(...args),
	refreshAccessToken: (...args: any[]) => mockRefreshAccessToken(...args),
	revokeUserRefreshToken: (...args: any[]) => mockRevokeUserRefreshToken(...args),
	authenticateWithGoogle: (...args: any[]) => mockAuthenticateWithGoogle(...args),
	verifyUserEmail: (...args: any[]) => mockVerifyUserEmail(...args),
	resendVerificationEmail: (...args: any[]) => mockResendVerificationEmail(...args),
	forgotPassword: (...args: any[]) => mockForgotPassword(...args),
	resetPassword: (...args: any[]) => mockResetPassword(...args)
}))

// Mock auth middleware to bypass authentication for protected routes
jest.mock('../../../src/trpc/middlewares/auth.middleware', () => {
	const { procedure } = require('../../../src/trpc')
	const { middleware } = require('../../../src/trpc')

	const mockAuthMiddleware = middleware(async ({ ctx, next }: any) => {
		return next({
			ctx: {
				...ctx,
				user: ctx.user ?? { id: 'test-user-id', email: 'test@example.com' }
			}
		})
	})

	return {
		authMiddleware: mockAuthMiddleware,
		protectedProcedure: procedure.use(mockAuthMiddleware),
		billingMiddleware: middleware(async ({ next }: any) => next()),
		billingProtectedProcedure: procedure.use(mockAuthMiddleware),
		verifiedEmailMiddleware: middleware(async ({ next }: any) => next()),
		verifiedEmailProcedure: procedure.use(mockAuthMiddleware)
	}
})

// Mock billing repository (imported by auth service indirectly)
jest.mock('../../../src/database/repositories/billing.repository')
jest.mock('../../../src/database/repositories/user.repository')

import { authRouter } from '../../../src/trpc/routers/auth.router'
import { createTRPCContext } from '../../../src/trpc'

// Create a caller for the auth router
const createCaller = () => {
	const ctx = createTRPCContext({
		req: { headers: { authorization: 'Bearer test-token' } } as any,
		res: { status: jest.fn().mockReturnThis(), json: jest.fn() } as any
	})
	return authRouter.createCaller(ctx)
}

describe('Auth Router', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('google', () => {
		it('should call authenticateWithGoogle with credential', async () => {
			const result = { accessToken: 'token', refreshToken: 'refresh' }
			mockAuthenticateWithGoogle.mockResolvedValue(result)

			const caller = createCaller()
			const response = await caller.google({ credential: 'google-credential-123' })

			expect(mockAuthenticateWithGoogle).toHaveBeenCalledWith({ credential: 'google-credential-123' })
			expect(response).toEqual(result)
		})

		it('should reject empty credential', async () => {
			const caller = createCaller()
			await expect(caller.google({ credential: '' })).rejects.toThrow()
		})
	})

	describe('login', () => {
		it('should call authenticateUser with email and password', async () => {
			const result = { accessToken: 'token', refreshToken: 'refresh' }
			mockAuthenticateUser.mockResolvedValue(result)

			const caller = createCaller()
			const response = await caller.login({ email: 'test@example.com', password: 'password123' })

			expect(mockAuthenticateUser).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' })
			expect(response).toEqual(result)
		})

		it('should reject invalid email', async () => {
			const caller = createCaller()
			await expect(caller.login({ email: 'invalid', password: 'password123' })).rejects.toThrow()
		})
	})

	describe('signup', () => {
		it('should call registerUser with signup data', async () => {
			const result = { accessToken: 'token', refreshToken: 'refresh' }
			mockRegisterUser.mockResolvedValue(result)

			const input = {
				fullName: 'Test User',
				email: 'test@example.com',
				phone: '1234567890',
				password: 'password123',
				age: 25
			}

			const caller = createCaller()
			const response = await caller.signup(input)

			expect(mockRegisterUser).toHaveBeenCalledWith(input)
			expect(response).toEqual(result)
		})

		it('should reject invalid signup data', async () => {
			const caller = createCaller()
			await expect(caller.signup({ fullName: '', email: 'invalid', phone: '', password: '', age: -1 })).rejects.toThrow()
		})
	})

	describe('refresh', () => {
		it('should call refreshAccessToken with refresh token', async () => {
			const result = { accessToken: 'new-token' }
			mockRefreshAccessToken.mockResolvedValue(result)

			const caller = createCaller()
			const response = await caller.refresh({ refreshToken: 'refresh-token-123' })

			expect(mockRefreshAccessToken).toHaveBeenCalledWith({ refreshToken: 'refresh-token-123' })
			expect(response).toEqual(result)
		})

		it('should reject empty refresh token', async () => {
			const caller = createCaller()
			await expect(caller.refresh({ refreshToken: '' })).rejects.toThrow()
		})
	})

	describe('logout', () => {
		it('should call revokeUserRefreshToken with user id from context', async () => {
			mockRevokeUserRefreshToken.mockResolvedValue(undefined)

			const caller = createCaller()
			const response = await caller.logout()

			expect(mockRevokeUserRefreshToken).toHaveBeenCalledWith({ userId: 'test-user-id' })
			expect(response).toEqual({ success: true })
		})
	})

	describe('verifyEmail', () => {
		it('should call verifyUserEmail with token', async () => {
			mockVerifyUserEmail.mockResolvedValue(undefined)

			const caller = createCaller()
			const response = await caller.verifyEmail({ token: 'verification-token-123' })

			expect(mockVerifyUserEmail).toHaveBeenCalledWith({ token: 'verification-token-123' })
			expect(response).toEqual({ success: true, message: 'Email verified successfully' })
		})
	})

	describe('resendVerificationEmail', () => {
		it('should call resendVerificationEmail with user id from context', async () => {
			mockResendVerificationEmail.mockResolvedValue(undefined)

			const caller = createCaller()
			const response = await caller.resendVerificationEmail()

			expect(mockResendVerificationEmail).toHaveBeenCalledWith({ userId: 'test-user-id' })
			expect(response).toEqual({ success: true, message: 'Verification email sent' })
		})
	})

	describe('forgotPassword', () => {
		it('should call forgotPassword with email', async () => {
			mockForgotPassword.mockResolvedValue(undefined)

			const caller = createCaller()
			const response = await caller.forgotPassword({ email: 'test@example.com' })

			expect(mockForgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' })
			expect(response).toEqual({
				success: true,
				message: 'If an account exists with this email, a password reset link has been sent'
			})
		})

		it('should reject invalid email', async () => {
			const caller = createCaller()
			await expect(caller.forgotPassword({ email: 'not-an-email' })).rejects.toThrow()
		})
	})

	describe('resetPassword', () => {
		it('should call resetPassword with token and new password', async () => {
			mockResetPassword.mockResolvedValue(undefined)

			const caller = createCaller()
			const response = await caller.resetPassword({ token: 'reset-token', newPassword: 'newpassword123' })

			expect(mockResetPassword).toHaveBeenCalledWith({ token: 'reset-token', newPassword: 'newpassword123' })
			expect(response).toEqual({ success: true, message: 'Password reset successfully' })
		})

		it('should reject short password', async () => {
			const caller = createCaller()
			await expect(caller.resetPassword({ token: 'reset-token', newPassword: 'short' })).rejects.toThrow()
		})
	})
})
