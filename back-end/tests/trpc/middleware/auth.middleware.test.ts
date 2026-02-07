import { TRPCError } from '@trpc/server'
import {
	authMiddleware,
	billingMiddleware,
	verifiedEmailMiddleware,
	protectedProcedure,
	billingProtectedProcedure,
	verifiedEmailProcedure
} from '../../../src/trpc/middlewares/auth.middleware'
import * as jwt from '../../../src/utils/jwt'
import * as userRepository from '../../../src/database/repositories/user.repository'
import * as billingRepository from '../../../src/database/repositories/billing.repository'

jest.mock('../../../src/utils/jwt')
jest.mock('../../../src/database/repositories/user.repository')
jest.mock('../../../src/database/repositories/billing.repository')

const mockJwt = jwt as jest.Mocked<typeof jwt>
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockBillingRepository = billingRepository as jest.Mocked<typeof billingRepository>

// Helper to invoke a tRPC MiddlewareBuilder's internal function
function callMiddleware(mw: any, opts: { ctx: any; next: any }) {
	// MiddlewareBuilder stores the fn as _middlewares[0] or directly as a callable
	const fn = mw._middlewares?.[0] ?? mw
	return fn({ ctx: opts.ctx, next: opts.next, type: 'mutation', path: 'test', input: undefined, rawInput: undefined, meta: undefined })
}

describe('tRPC Auth Middleware', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('authMiddleware', () => {
		it('should throw UNAUTHORIZED when no authorization header', async () => {
			const ctx = { req: { headers: {} } }
			const next = jest.fn()

			await expect(callMiddleware(authMiddleware, { ctx, next })).rejects.toThrow(TRPCError)
			await expect(callMiddleware(authMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'UNAUTHORIZED'
			})
			expect(next).not.toHaveBeenCalled()
		})

		it('should authenticate user with valid Bearer token', async () => {
			const mockUser = { id: 'user-123', email: 'test@example.com' }
			const ctx = { req: { headers: { authorization: 'Bearer valid-token' } } }
			const next = jest.fn().mockResolvedValue('next-result')

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123' })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)

			const result = await callMiddleware(authMiddleware, { ctx, next })

			expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: 'valid-token' })
			expect(mockJwt.decodeJwtToken).toHaveBeenCalledWith({ token: 'valid-token' })
			expect(mockUserRepository.getUserById).toHaveBeenCalledWith({ id: 'user-123' })
			expect(next).toHaveBeenCalledWith({ ctx: expect.objectContaining({ user: mockUser }) })
		})

		it('should handle token without Bearer prefix', async () => {
			const mockUser = { id: 'user-123', email: 'test@example.com' }
			const ctx = { req: { headers: { authorization: 'raw-token' } } }
			const next = jest.fn().mockResolvedValue('next-result')

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123' })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)

			await callMiddleware(authMiddleware, { ctx, next })

			expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: 'raw-token' })
		})

		it('should throw UNAUTHORIZED when user not found', async () => {
			const ctx = { req: { headers: { authorization: 'Bearer valid-token' } } }
			const next = jest.fn()

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'nonexistent' })
			mockUserRepository.getUserById.mockResolvedValue(null)

			await expect(callMiddleware(authMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				message: 'User not found'
			})
		})

		it('should throw UNAUTHORIZED when token verification fails', async () => {
			const ctx = { req: { headers: { authorization: 'Bearer bad-token' } } }
			const next = jest.fn()

			mockJwt.verifyJwtToken.mockImplementation(() => {
				throw new Error('Token expired')
			})

			await expect(callMiddleware(authMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				message: 'Token expired'
			})
		})

		it('should re-throw TRPCError as-is', async () => {
			const ctx = { req: { headers: { authorization: 'Bearer valid-token' } } }
			const next = jest.fn()

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123' })
			mockUserRepository.getUserById.mockRejectedValue(new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB error' }))

			await expect(callMiddleware(authMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'DB error'
			})
		})

		it('should use "Invalid token" message for non-Error throws', async () => {
			const ctx = { req: { headers: { authorization: 'Bearer bad-token' } } }
			const next = jest.fn()

			mockJwt.verifyJwtToken.mockImplementation(() => {
				throw 'string error'
			})

			await expect(callMiddleware(authMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				message: 'Invalid token'
			})
		})
	})

	describe('billingMiddleware', () => {
		it('should throw UNAUTHORIZED when no user in context', async () => {
			const ctx = { req: { headers: {} } }
			const next = jest.fn()

			await expect(callMiddleware(billingMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				message: 'Authentication required'
			})
		})

		it('should proceed when billing is valid', async () => {
			const ctx = { user: { id: 'user-123' }, req: { headers: {} } }
			const next = jest.fn().mockResolvedValue('ok')
			const futureBilling = {
				id: 'billing-123',
				userId: 'user-123',
				expiresAt: new Date(Date.now() + 86400000)
			}

			mockBillingRepository.getBillingByUserId.mockResolvedValue(futureBilling)

			await callMiddleware(billingMiddleware, { ctx, next })

			expect(next).toHaveBeenCalled()
		})

		it('should throw NOT_FOUND when no billing exists', async () => {
			const ctx = { user: { id: 'user-123' }, req: { headers: {} } }
			const next = jest.fn()

			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)

			await expect(callMiddleware(billingMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'NOT_FOUND',
				message: 'User billing not found'
			})
		})

		it('should throw PAYMENT_REQUIRED when billing expired', async () => {
			const ctx = { user: { id: 'user-123' }, req: { headers: {} } }
			const next = jest.fn()
			const expiredBilling = {
				id: 'billing-123',
				userId: 'user-123',
				expiresAt: new Date('2020-01-01')
			}

			mockBillingRepository.getBillingByUserId.mockResolvedValue(expiredBilling)

			await expect(callMiddleware(billingMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'PAYMENT_REQUIRED',
				message: 'User billing has expired'
			})
		})

		it('should re-throw TRPCError as-is', async () => {
			const ctx = { user: { id: 'user-123' }, req: { headers: {} } }
			const next = jest.fn()

			mockBillingRepository.getBillingByUserId.mockRejectedValue(new TRPCError({ code: 'NOT_FOUND', message: 'Custom error' }))

			await expect(callMiddleware(billingMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'NOT_FOUND',
				message: 'Custom error'
			})
		})

		it('should throw INTERNAL_SERVER_ERROR for non-TRPC errors', async () => {
			const ctx = { user: { id: 'user-123' }, req: { headers: {} } }
			const next = jest.fn()

			mockBillingRepository.getBillingByUserId.mockRejectedValue(new Error('DB down'))

			await expect(callMiddleware(billingMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'DB down'
			})
		})

		it('should use fallback message for non-Error throws', async () => {
			const ctx = { user: { id: 'user-123' }, req: { headers: {} } }
			const next = jest.fn()

			mockBillingRepository.getBillingByUserId.mockRejectedValue('string error')

			await expect(callMiddleware(billingMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Billing verification failed'
			})
		})
	})

	describe('verifiedEmailMiddleware', () => {
		it('should throw UNAUTHORIZED when no user in context', async () => {
			const ctx = { req: { headers: {} } }
			const next = jest.fn()

			await expect(callMiddleware(verifiedEmailMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'UNAUTHORIZED',
				message: 'Authentication required'
			})
		})

		it('should throw FORBIDDEN when email not verified', async () => {
			const ctx = { user: { id: 'user-123', emailVerified: false }, req: { headers: {} } }
			const next = jest.fn()

			await expect(callMiddleware(verifiedEmailMiddleware, { ctx, next })).rejects.toMatchObject({
				code: 'FORBIDDEN',
				message: 'Please verify your email before making a purchase'
			})
		})

		it('should proceed when email is verified', async () => {
			const ctx = { user: { id: 'user-123', emailVerified: true }, req: { headers: {} } }
			const next = jest.fn().mockResolvedValue('ok')

			await callMiddleware(verifiedEmailMiddleware, { ctx, next })

			expect(next).toHaveBeenCalled()
		})
	})

	describe('procedure exports', () => {
		it('should export protectedProcedure', () => {
			expect(protectedProcedure).toBeDefined()
			expect(protectedProcedure._def).toBeDefined()
		})

		it('should export billingProtectedProcedure', () => {
			expect(billingProtectedProcedure).toBeDefined()
			expect(billingProtectedProcedure._def).toBeDefined()
		})

		it('should export verifiedEmailProcedure', () => {
			expect(verifiedEmailProcedure).toBeDefined()
			expect(verifiedEmailProcedure._def).toBeDefined()
		})
	})
})
