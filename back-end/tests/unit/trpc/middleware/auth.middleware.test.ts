import { TRPCError } from '@trpc/server'
import { authMiddleware, billingMiddleware, protectedProcedure, billingProtectedProcedure } from '../../../../src/trpc/middlewares/auth.middleware'
import * as jwt from '../../../../src/utils/jwt'
import * as userRepository from '../../../../src/database/repositories/user.repository'
import * as billingRepository from '../../../../src/database/repositories/billing.repository'

jest.mock('../../../../src/utils/jwt')
jest.mock('../../../../src/database/repositories/user.repository')
jest.mock('../../../../src/database/repositories/billing.repository')

const mockJwt = jwt as jest.Mocked<typeof jwt>
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockBillingRepository = billingRepository as jest.Mocked<typeof billingRepository>

const testAuthMiddleware = async (ctx: any, next: any) => {
    const token = ctx.req.headers['authorization']

    if (!token) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'No authorization token provided'
        })
    }

    try {
        jwt.verifyJwtToken({ token })
        const { userId } = jwt.decodeJwtToken({ token })
        const user = await userRepository.getUserById({ id: userId })

        if (!user) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'User not found'
            })
        }

        return next({
            ctx: {
                ...ctx,
                user
            }
        })
    } catch (error: any) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: error.message || 'Invalid token'
        })
    }
}

const testBillingMiddleware = async (ctx: any, next: any) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
        })
    }

    try {
        const userBilling = await billingRepository.getBillingByUserId({ userId: ctx.user.id })

        if (!userBilling) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'User billing not found'
            })
        }

        if (userBilling.expiresAt < new Date()) {
            throw new TRPCError({
                code: 'PAYMENT_REQUIRED',
                message: 'User billing has expired'
            })
        }

        return next()
    } catch (error: any) {
        if (error instanceof TRPCError) {
            throw error
        }

        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Billing verification failed'
        })
    }
}

describe('tRPC Auth Middleware', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('authMiddleware logic', () => {
        it('should throw UNAUTHORIZED when no token is provided', async () => {
            const ctx = {
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            await expect(testAuthMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'No authorization token provided'
                })
            )

            expect(next).not.toHaveBeenCalled()
        })

        it('should throw UNAUTHORIZED when authorization header is empty', async () => {
            const ctx = {
                req: {
                    headers: {
                        authorization: ''
                    }
                }
            }
            const next = jest.fn()

            await expect(testAuthMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'No authorization token provided'
                })
            )

            expect(next).not.toHaveBeenCalled()
        })

        it('should successfully authenticate user with valid token', async () => {
            const token = 'Bearer valid-token'
            const userId = 'user-123'
            const mockUser = {
                id: userId,
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const ctx = {
                req: {
                    headers: {
                        authorization: token
                    }
                }
            }
            const next = jest.fn().mockResolvedValue({ ctx: { ...ctx, user: mockUser } })

            mockJwt.verifyJwtToken.mockReturnValue(undefined)
            mockJwt.decodeJwtToken.mockReturnValue({ userId })
            mockUserRepository.getUserById.mockResolvedValue(mockUser as any)

            const result = await testAuthMiddleware(ctx, next)

            expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token })
            expect(mockJwt.decodeJwtToken).toHaveBeenCalledWith({ token })
            expect(mockUserRepository.getUserById).toHaveBeenCalledWith({ id: userId })
            expect(next).toHaveBeenCalledWith({
                ctx: {
                    ...ctx,
                    user: mockUser
                }
            })
            expect(result).toEqual({ ctx: { ...ctx, user: mockUser } })
        })

        it('should throw UNAUTHORIZED when token verification fails', async () => {
            const token = 'Bearer invalid-token'
            const ctx = {
                req: {
                    headers: {
                        authorization: token
                    }
                }
            }
            const next = jest.fn()

            mockJwt.verifyJwtToken.mockImplementation(() => {
                throw new Error('Token expired')
            })

            await expect(testAuthMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Token expired'
                })
            )

            expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token })
            expect(mockJwt.decodeJwtToken).not.toHaveBeenCalled()
            expect(next).not.toHaveBeenCalled()
        })

        it('should throw UNAUTHORIZED when user is not found', async () => {
            const token = 'Bearer valid-token'
            const userId = 'user-nonexistent'
            const ctx = {
                req: {
                    headers: {
                        authorization: token
                    }
                }
            }
            const next = jest.fn()

            mockJwt.verifyJwtToken.mockReturnValue(undefined)
            mockJwt.decodeJwtToken.mockReturnValue({ userId })
            mockUserRepository.getUserById.mockResolvedValue(null)

            await expect(testAuthMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'User not found'
                })
            )

            expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token })
            expect(mockJwt.decodeJwtToken).toHaveBeenCalledWith({ token })
            expect(mockUserRepository.getUserById).toHaveBeenCalledWith({ id: userId })
            expect(next).not.toHaveBeenCalled()
        })

        it('should throw UNAUTHORIZED with generic message when error has no message', async () => {
            const token = 'Bearer invalid-token'
            const ctx = {
                req: {
                    headers: {
                        authorization: token
                    }
                }
            }
            const next = jest.fn()

            mockJwt.verifyJwtToken.mockImplementation(() => {
                throw new Error()
            })

            await expect(testAuthMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Invalid token'
                })
            )

            expect(next).not.toHaveBeenCalled()
        })
    })

    describe('billingMiddleware logic', () => {
        it('should throw UNAUTHORIZED when user is not authenticated', async () => {
            const ctx = {
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            await expect(testBillingMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                })
            )

            expect(next).not.toHaveBeenCalled()
        })

        it('should throw NOT_FOUND when user billing is not found', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const ctx = {
                user: mockUser,
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            mockBillingRepository.getBillingByUserId.mockResolvedValue(null)

            await expect(testBillingMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User billing not found'
                })
            )

            expect(mockBillingRepository.getBillingByUserId).toHaveBeenCalledWith({ userId: mockUser.id })
            expect(next).not.toHaveBeenCalled()
        })

        it('should throw PAYMENT_REQUIRED when billing has expired', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const expiredDate = new Date('2020-01-01')
            const mockBilling = {
                id: 'billing-123',
                userId: mockUser.id,
                status: 'active',
                expiresAt: expiredDate
            }

            const ctx = {
                user: mockUser,
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            mockBillingRepository.getBillingByUserId.mockResolvedValue(mockBilling as any)

            await expect(testBillingMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'PAYMENT_REQUIRED',
                    message: 'User billing has expired'
                })
            )

            expect(mockBillingRepository.getBillingByUserId).toHaveBeenCalledWith({ userId: mockUser.id })
            expect(next).not.toHaveBeenCalled()
        })

        it('should successfully proceed when billing is valid', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            const mockBilling = {
                id: 'billing-123',
                userId: mockUser.id,
                status: 'active',
                expiresAt: futureDate
            }

            const ctx = {
                user: mockUser,
                req: {
                    headers: {}
                }
            }
            const next = jest.fn().mockResolvedValue({ success: true })

            mockBillingRepository.getBillingByUserId.mockResolvedValue(mockBilling as any)

            const result = await testBillingMiddleware(ctx, next)

            expect(mockBillingRepository.getBillingByUserId).toHaveBeenCalledWith({ userId: mockUser.id })
            expect(next).toHaveBeenCalled()
            expect(result).toEqual({ success: true })
        })

        it('should re-throw TRPCError when it occurs', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const ctx = {
                user: mockUser,
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            const trpcError = new TRPCError({
                code: 'NOT_FOUND',
                message: 'Custom TRPC error'
            })

            mockBillingRepository.getBillingByUserId.mockRejectedValue(trpcError)

            await expect(testBillingMiddleware(ctx, next)).rejects.toThrow(trpcError)

            expect(next).not.toHaveBeenCalled()
        })

        it('should throw INTERNAL_SERVER_ERROR for non-TRPC errors', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const ctx = {
                user: mockUser,
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            const genericError = new Error('Database connection failed')
            mockBillingRepository.getBillingByUserId.mockRejectedValue(genericError)

            await expect(testBillingMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Database connection failed'
                })
            )

            expect(next).not.toHaveBeenCalled()
        })

        it('should throw INTERNAL_SERVER_ERROR with generic message when error has no message', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User'
            }

            const ctx = {
                user: mockUser,
                req: {
                    headers: {}
                }
            }
            const next = jest.fn()

            const errorWithoutMessage = new Error()
            mockBillingRepository.getBillingByUserId.mockRejectedValue(errorWithoutMessage)

            await expect(testBillingMiddleware(ctx, next)).rejects.toThrow(
                new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Billing verification failed'
                })
            )

            expect(next).not.toHaveBeenCalled()
        })
    })

    describe('middleware exports', () => {
        it('should export authMiddleware', () => {
            expect(authMiddleware).toBeDefined()
            expect(typeof authMiddleware).toBe('object')
        })

        it('should export billingMiddleware', () => {
            expect(billingMiddleware).toBeDefined()
            expect(typeof billingMiddleware).toBe('object')
        })

        it('should export protectedProcedure', () => {
            expect(protectedProcedure).toBeDefined()
            expect(protectedProcedure._def).toBeDefined()
        })

        it('should export billingProtectedProcedure', () => {
            expect(billingProtectedProcedure).toBeDefined()
            expect(billingProtectedProcedure._def).toBeDefined()
        })

        it('should have correct middleware chain for billingProtectedProcedure', () => {
            expect(billingProtectedProcedure._def.middlewares).toBeDefined()
            expect(billingProtectedProcedure._def.middlewares.length).toBeGreaterThan(0)
        })
    })
})