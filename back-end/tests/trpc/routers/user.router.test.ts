const mockGetUserProfile = jest.fn()
const mockUpdateUserProfile = jest.fn()
const mockRequestEmailChange = jest.fn()
const mockVerifyEmailChange = jest.fn()

jest.mock('../../../src/services/user.service', () => ({
	getUserProfile: (...args: any[]) => mockGetUserProfile(...args),
	updateUserProfile: (...args: any[]) => mockUpdateUserProfile(...args)
}))

jest.mock('../../../src/services/email.service', () => ({
	requestEmailChange: (...args: any[]) => mockRequestEmailChange(...args),
	verifyEmailChange: (...args: any[]) => mockVerifyEmailChange(...args)
}))

// Mock auth middleware to bypass authentication
jest.mock('../../../src/trpc/middlewares/auth.middleware', () => {
	const { procedure, middleware } = require('../../../src/trpc')

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

jest.mock('../../../src/database/repositories/user.repository')
jest.mock('../../../src/database/repositories/billing.repository')

import { userRouter } from '../../../src/trpc/routers/user.router'
import { createTRPCContext } from '../../../src/trpc'

const createCaller = () => {
	const ctx = createTRPCContext({
		req: { headers: { authorization: 'Bearer test-token' } } as any,
		res: { status: jest.fn().mockReturnThis(), json: jest.fn() } as any
	})
	return userRouter.createCaller(ctx)
}

describe('User Router', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getUserById', () => {
		it('should return user profile from context user id', async () => {
			const profile = { id: 'test-user-id', email: 'test@example.com', fullName: 'Test' }
			mockGetUserProfile.mockResolvedValue(profile)

			const caller = createCaller()
			const result = await caller.getUserById()

			expect(mockGetUserProfile).toHaveBeenCalledWith({ userId: 'test-user-id' })
			expect(result).toEqual(profile)
		})
	})

	describe('updateUserById', () => {
		it('should update user profile', async () => {
			const updated = { id: 'test-user-id', fullName: 'New Name' }
			mockUpdateUserProfile.mockResolvedValue(updated)

			const caller = createCaller()
			const result = await caller.updateUserById({ fullName: 'New Name' })

			expect(mockUpdateUserProfile).toHaveBeenCalledWith({
				userId: 'test-user-id',
				updates: { fullName: 'New Name' }
			})
			expect(result).toEqual(updated)
		})

		it('should reject empty update', async () => {
			const caller = createCaller()
			await expect(caller.updateUserById({})).rejects.toThrow()
		})
	})

	describe('requestEmailChange', () => {
		it('should request email change with new email', async () => {
			const response = { success: true, message: 'Verification code sent' }
			mockRequestEmailChange.mockResolvedValue(response)

			const caller = createCaller()
			const result = await caller.requestEmailChange({ newEmail: 'new@example.com' })

			expect(mockRequestEmailChange).toHaveBeenCalledWith({
				userId: 'test-user-id',
				newEmail: 'new@example.com'
			})
			expect(result).toEqual(response)
		})

		it('should reject invalid email', async () => {
			const caller = createCaller()
			await expect(caller.requestEmailChange({ newEmail: 'not-an-email' })).rejects.toThrow()
		})
	})

	describe('verifyEmailChange', () => {
		it('should verify email change with valid code', async () => {
			const profile = { id: 'test-user-id', email: 'new@example.com' }
			mockVerifyEmailChange.mockResolvedValue(profile)

			const caller = createCaller()
			const result = await caller.verifyEmailChange({ code: '123456' })

			expect(mockVerifyEmailChange).toHaveBeenCalledWith({
				userId: 'test-user-id',
				code: '123456'
			})
			expect(result).toEqual(profile)
		})

		it('should reject invalid code format', async () => {
			const caller = createCaller()
			await expect(caller.verifyEmailChange({ code: 'abc' })).rejects.toThrow()
		})
	})
})
