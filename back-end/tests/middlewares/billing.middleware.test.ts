import { Request, Response, NextFunction } from 'express'
import { verifyStripeWebhookSignatureMiddleware, IBillingRequest } from '../../src/middlewares/billing.middleware'

jest.mock('../../src/utils/stripe', () => ({
	webhooks: {
		constructEvent: jest.fn()
	}
}))

// global-config is mocked globally in jest.setup.ts with stripeWebhookSecret: 'whsec_test_fake_webhook_secret_for_integration_tests'

import stripe from '../../src/utils/stripe'

const mockStripe = stripe as jest.Mocked<typeof stripe>

describe('Billing Middleware', () => {
	let mockReq: Partial<Request>
	let mockRes: Partial<Response>
	let mockNext: NextFunction

	beforeEach(() => {
		mockReq = {
			headers: {},
			body: 'raw-webhook-body'
		}
		mockRes = {
			sendStatus: jest.fn()
		}
		mockNext = jest.fn()

		jest.clearAllMocks()
	})

	describe('verifyStripeWebhookSignatureMiddleware', () => {
		it('should return 400 when no stripe-signature header is present', () => {
			mockReq.headers = {}

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(mockRes.sendStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it('should successfully verify webhook signature and call next', () => {
			const mockEvent = {
				id: 'evt_test_123',
				type: 'invoice.paid',
				data: { object: {} }
			}

			mockReq.headers = {
				'stripe-signature': 'valid-signature'
			}
			;(mockStripe.webhooks.constructEvent as jest.Mock).mockReturnValue(mockEvent)

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
				'raw-webhook-body',
				'valid-signature',
				'whsec_test_fake_webhook_secret_for_integration_tests'
			)
			expect((mockReq as IBillingRequest).billingEvent).toEqual(mockEvent)
			expect(mockNext).toHaveBeenCalled()
			expect(mockRes.sendStatus).not.toHaveBeenCalled()
		})

		it('should return 400 when webhook signature verification fails', () => {
			mockReq.headers = {
				'stripe-signature': 'invalid-signature'
			}

			const mockError = new Error('Invalid signature')
			;(mockStripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
				throw mockError
			})

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
				'raw-webhook-body',
				'invalid-signature',
				'whsec_test_fake_webhook_secret_for_integration_tests'
			)
			expect(mockRes.sendStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
		})

		it('should handle empty stripe-signature header', () => {
			mockReq.headers = {
				'stripe-signature': ''
			}

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(mockRes.sendStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
			expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled()
		})

		it('should handle null stripe-signature header', () => {
			mockReq.headers = {
				'stripe-signature': null
			}

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(mockRes.sendStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
			expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled()
		})

		it('should handle undefined stripe-signature header', () => {
			mockReq.headers = {
				'stripe-signature': undefined
			}

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(mockRes.sendStatus).toHaveBeenCalledWith(400)
			expect(mockNext).not.toHaveBeenCalled()
			expect(mockStripe.webhooks.constructEvent).not.toHaveBeenCalled()
		})

		it('should log error for signature verification failure', () => {
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

			mockReq.headers = {
				'stripe-signature': 'invalid-signature'
			}

			const mockError = new Error('Signature verification failed')
			;(mockStripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
				throw mockError
			})

			verifyStripeWebhookSignatureMiddleware(mockReq as Request, mockRes as Response, mockNext)

			expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Signature verification failed'))

			consoleSpy.mockRestore()
		})
	})
})
