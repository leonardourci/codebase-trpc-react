import { TRPCError } from '@trpc/server'
import { middleware, procedure } from '../trpc'
import { verifyJwtToken, decodeJwtToken } from '../../utils/jwt'
import { getUserById } from '../../database/repositories/user.repository'
import { getBillingByUserId } from '../../database/repositories/billing.repository'

const TOKEN_PREFIX = 'Bearer '

/**
 * tRPC middleware that verifies JWT token and adds user to context
 */
export const authMiddleware = middleware(async ({ ctx, next }) => {
	const authHeader = ctx.req.headers['authorization']

	if (!authHeader) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'No authorization token provided'
		})
	}

	const token = authHeader.startsWith(TOKEN_PREFIX) ? authHeader.slice(TOKEN_PREFIX.length) : authHeader

	try {
		verifyJwtToken({ token })

		const { userId } = decodeJwtToken({ token })

		const user = await getUserById({ id: userId })

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
	} catch (error: unknown) {
		if (error instanceof TRPCError) {
			throw error
		}
		const errorMessage = error instanceof Error ? error.message : 'Invalid token'
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: errorMessage
		})
	}
})

/**
 * Create a protected procedure that requires authentication
 */
export const protectedProcedure = procedure.use(authMiddleware)

/**
 * tRPC middleware that verifies user billing status
 * Reuses existing billing verification logic from Express middleware
 */
export const billingMiddleware = middleware(async ({ ctx, next }) => {
	// Ensure user is authenticated first
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Authentication required'
		})
	}

	try {
		const userBilling = await getBillingByUserId({ userId: ctx.user.id })

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
	} catch (error: unknown) {
		if (error instanceof TRPCError) {
			throw error
		}

		const errorMessage = error instanceof Error ? error.message : 'Billing verification failed'
		throw new TRPCError({
			code: 'INTERNAL_SERVER_ERROR',
			message: errorMessage
		})
	}
})

export const billingProtectedProcedure = procedure.use(authMiddleware).use(billingMiddleware)

export const verifiedEmailMiddleware = middleware(async ({ ctx, next }) => {
	// Ensure user is authenticated first
	if (!ctx.user) {
		throw new TRPCError({
			code: 'UNAUTHORIZED',
			message: 'Authentication required'
		})
	}

	if (!ctx.user.emailVerified) {
		throw new TRPCError({
			code: 'FORBIDDEN',
			message: 'Please verify your email before making a purchase'
		})
	}

	return next()
})

// Protected procedure that requires authentication and verified email
export const verifiedEmailProcedure = procedure.use(authMiddleware).use(verifiedEmailMiddleware)
