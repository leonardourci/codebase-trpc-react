const mockGetBillingByUserId = jest.fn()
const mockGetProductById = jest.fn()
const mockGetProductByExternalPriceId = jest.fn()
const mockStripeCheckoutCreate = jest.fn()
const mockStripePortalCreate = jest.fn()

jest.mock('../../../src/database/repositories/billing.repository', () => ({
	getBillingByUserId: (...args: any[]) => mockGetBillingByUserId(...args)
}))

jest.mock('../../../src/database/repositories/product.repository', () => ({
	getProductByExternalPriceId: (...args: any[]) => mockGetProductByExternalPriceId(...args),
	getProductById: (...args: any[]) => mockGetProductById(...args)
}))

jest.mock('../../../src/utils/stripe', () => ({
	__esModule: true,
	default: {
		checkout: {
			sessions: {
				create: (...args: any[]) => mockStripeCheckoutCreate(...args)
			}
		},
		billingPortal: {
			sessions: {
				create: (...args: any[]) => mockStripePortalCreate(...args)
			}
		}
	}
}))

// Mock auth middleware to bypass authentication
jest.mock('../../../src/trpc/middlewares/auth.middleware', () => {
	const { procedure, middleware } = require('../../../src/trpc')

	const mockAuthMiddleware = middleware(async ({ ctx, next }: any) => {
		return next({
			ctx: {
				...ctx,
				user: ctx.user ?? { id: 'test-user-id', email: 'test@example.com', emailVerified: true }
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

import { billingRouter } from '../../../src/trpc/routers/billing.router'
import { createTRPCContext } from '../../../src/trpc'

const createCaller = () => {
	const ctx = createTRPCContext({
		req: { headers: { authorization: 'Bearer test-token' } },
		res: { status: jest.fn().mockReturnThis(), json: jest.fn() }
	})
	return billingRouter.createCaller(ctx)
}

describe('Billing Router', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('getUserBilling', () => {
		it('should return billing with product info when user has active billing', async () => {
			const mockBilling = { id: 'billing-1', status: 'active', productId: 'prod-1' }
			const mockProduct = { id: 'prod-1', externalPriceId: 'price_123' }

			mockGetBillingByUserId.mockResolvedValue(mockBilling)
			mockGetProductById.mockResolvedValue(mockProduct)

			const caller = createCaller()
			const result = await caller.getUserBilling()

			expect(result).toEqual({
				hasSubscription: true,
				billing: mockBilling,
				externalPriceId: 'price_123'
			})
		})

		it('should return no subscription when billing is null', async () => {
			mockGetBillingByUserId.mockResolvedValue(null)

			const caller = createCaller()
			const result = await caller.getUserBilling()

			expect(result).toEqual({
				hasSubscription: false,
				billing: null,
				externalPriceId: null
			})
			expect(mockGetProductById).not.toHaveBeenCalled()
		})

		it('should return no subscription when billing status is not active', async () => {
			const mockBilling = { id: 'billing-1', status: 'canceled', productId: 'prod-1' }
			const mockProduct = { id: 'prod-1', externalPriceId: 'price_123' }

			mockGetBillingByUserId.mockResolvedValue(mockBilling)
			mockGetProductById.mockResolvedValue(mockProduct)

			const caller = createCaller()
			const result = await caller.getUserBilling()

			expect(result.hasSubscription).toBe(false)
		})

		it('should return null externalPriceId when billing has no productId', async () => {
			const mockBilling = { id: 'billing-1', status: 'active', productId: null }

			mockGetBillingByUserId.mockResolvedValue(mockBilling)

			const caller = createCaller()
			const result = await caller.getUserBilling()

			expect(result.externalPriceId).toBeNull()
			expect(mockGetProductById).not.toHaveBeenCalled()
		})
	})

	describe('createCheckoutSession', () => {
		const validInput = {
			priceId: 'price_123',
			successUrl: 'https://example.com/success',
			cancelUrl: 'https://example.com/cancel'
		}

		it('should create checkout session successfully', async () => {
			const mockProduct = { id: 'prod-1', externalPriceId: 'price_123', externalProductId: 'prod_ext' }
			mockGetProductByExternalPriceId.mockResolvedValue(mockProduct)
			mockGetBillingByUserId.mockResolvedValue(null)
			mockStripeCheckoutCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/123' })

			const caller = createCaller()
			const result = await caller.createCheckoutSession(validInput)

			expect(result).toEqual({ id: 'cs_123', url: 'https://checkout.stripe.com/123' })
			expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					mode: 'subscription',
					customer_email: 'test@example.com',
					line_items: [{ price: 'price_123', quantity: 1 }],
					success_url: validInput.successUrl,
					cancel_url: validInput.cancelUrl
				})
			)
		})

		it('should reuse existing customer ID when billing exists', async () => {
			const mockProduct = { id: 'prod-1', externalPriceId: 'price_123', externalProductId: 'prod_ext' }
			mockGetProductByExternalPriceId.mockResolvedValue(mockProduct)
			mockGetBillingByUserId.mockResolvedValue({ externalCustomerId: 'cus_existing' })
			mockStripeCheckoutCreate.mockResolvedValue({ id: 'cs_123', url: 'https://checkout.stripe.com/123' })

			const caller = createCaller()
			await caller.createCheckoutSession(validInput)

			expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
				expect.objectContaining({
					customer: 'cus_existing'
				})
			)
		})

		it('should throw NOT_FOUND when product not found for price ID', async () => {
			mockGetProductByExternalPriceId.mockResolvedValue(null)

			const caller = createCaller()
			await expect(caller.createCheckoutSession(validInput)).rejects.toThrow('Product not found for the given price ID')
		})

		it('should throw BAD_REQUEST when product has no external price/product ID', async () => {
			mockGetProductByExternalPriceId.mockResolvedValue({ id: 'prod-1', externalPriceId: null, externalProductId: null })

			const caller = createCaller()
			await expect(caller.createCheckoutSession(validInput)).rejects.toThrow('This product is not available for purchase')
		})

		it('should throw INTERNAL_SERVER_ERROR when session URL is null', async () => {
			const mockProduct = { id: 'prod-1', externalPriceId: 'price_123', externalProductId: 'prod_ext' }
			mockGetProductByExternalPriceId.mockResolvedValue(mockProduct)
			mockGetBillingByUserId.mockResolvedValue(null)
			mockStripeCheckoutCreate.mockResolvedValue({ id: 'cs_123', url: null })

			const caller = createCaller()
			await expect(caller.createCheckoutSession(validInput)).rejects.toThrow('Checkout URL not available')
		})

		it('should reject invalid input', async () => {
			const caller = createCaller()
			await expect(caller.createCheckoutSession({ priceId: '', successUrl: 'not-url', cancelUrl: 'not-url' })).rejects.toThrow()
		})
	})

	describe('createCustomerPortalSession', () => {
		const validInput = { returnUrl: 'https://example.com/billing' }

		it('should create portal session successfully', async () => {
			mockGetBillingByUserId.mockResolvedValue({ externalCustomerId: 'cus_123' })
			mockStripePortalCreate.mockResolvedValue({ url: 'https://billing.stripe.com/portal' })

			const caller = createCaller()
			const result = await caller.createCustomerPortalSession(validInput)

			expect(result).toEqual({ url: 'https://billing.stripe.com/portal' })
			expect(mockStripePortalCreate).toHaveBeenCalledWith({
				customer: 'cus_123',
				return_url: validInput.returnUrl
			})
		})

		it('should throw NOT_FOUND when billing not found', async () => {
			mockGetBillingByUserId.mockResolvedValue(null)

			const caller = createCaller()
			await expect(caller.createCustomerPortalSession(validInput)).rejects.toThrow('User billing not found')
		})

		it('should throw NOT_FOUND when no external customer ID', async () => {
			mockGetBillingByUserId.mockResolvedValue({ externalCustomerId: null })

			const caller = createCaller()
			await expect(caller.createCustomerPortalSession(validInput)).rejects.toThrow('Stripe customer not found')
		})
	})
})
