import { Request, Response } from 'express'
import { processBillingWebhookHandler } from '../../src/controllers/billing.controller'
import { IBillingRequest } from '../../src/middlewares/billing.middleware'
import * as productRepository from '../../src/database/repositories/product.repository'
import * as billingService from '../../src/services/billing.service'
import { EStatusCodes } from '../../src/utils/status-codes'
import { unixTimestampToDate } from '../../src/utils/time'

// Mock dependencies
jest.mock('../../src/database/repositories/product.repository')
jest.mock('../../src/services/billing.service')

const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>
const mockBillingService = billingService as jest.Mocked<typeof billingService>

// Test timestamp constants - Unix timestamps (seconds since epoch)
const MOCK_INVOICE_PERIOD_END = 1640995200 // Dec 31, 2021 16:00:00 UTC - Invoice line item period end & subscription cancel_at
const MOCK_SUBSCRIPTION_CURRENT_PERIOD_END = 1641081600 // Jan 2, 2022 00:00:00 UTC - Subscription item's current_period_end

describe('Billing Controller', () => {
	let mockReq: Partial<IBillingRequest>
	let mockRes: Partial<Response>

	beforeEach(() => {
		mockReq = {}
		mockRes = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn()
		}

		jest.clearAllMocks()
	})

	describe('processBillingWebhookHandler', () => {
		it('should throw error when billingEvent is missing', async () => {
			mockReq.billingEvent = undefined

			await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)).rejects.toThrow(
				'req.billingEvent is missing in processBillingWebhookHandler'
			)
		})

		describe('invoice.paid event', () => {
			it('should process invoice.paid event successfully', async () => {
				const mockProduct = {
					id: 'product-123',
					name: 'Test Product',
					externalPriceId: 'price_123'
				}

				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							parent: {
								subscription_details: {
									subscription: 'sub_123'
								}
							},
							lines: {
								data: [
									{
										pricing: {
											price_details: {
												price: 'price_123'
											}
										},
										period: {
											start: MOCK_INVOICE_PERIOD_END - 2592000,
											end: MOCK_INVOICE_PERIOD_END
										}
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(mockProduct)
				mockBillingService.registerUserBilling.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockProductRepository.getProductByExternalPriceId).toHaveBeenCalledWith({
					priceId: 'price_123'
				})
				expect(mockBillingService.registerUserBilling).toHaveBeenCalledWith({
					userEmail: 'test@example.com',
					productId: 'product-123',
					externalCustomerId: 'cus_123',
					externalSubscriptionId: 'sub_123',
					expiresAt: MOCK_INVOICE_PERIOD_END
				})
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})

			it('should log error and return 200 when product is not found', async () => {
				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							parent: {
								subscription_details: {
									subscription: 'sub_123'
								}
							},
							lines: {
								data: [
									{
										pricing: {
											price_details: {
												price: 'price_nonexistent'
											}
										},
										period: {
											start: MOCK_INVOICE_PERIOD_END - 2592000,
											end: MOCK_INVOICE_PERIOD_END
										}
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(null)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockBillingService.registerUserBilling).not.toHaveBeenCalled()
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})

			it('should handle subscription as object with id property', async () => {
				const mockProduct = {
					id: 'product-123',
					name: 'Test Product',
					externalPriceId: 'price_123'
				}

				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							parent: {
								subscription_details: {
									subscription: { id: 'sub_obj_123' }
								}
							},
							lines: {
								data: [
									{
										pricing: {
											price_details: {
												price: 'price_123'
											}
										},
										period: {
											start: MOCK_INVOICE_PERIOD_END - 2592000,
											end: MOCK_INVOICE_PERIOD_END
										}
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(mockProduct)
				mockBillingService.registerUserBilling.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockBillingService.registerUserBilling).toHaveBeenCalledWith(expect.objectContaining({ externalSubscriptionId: 'sub_obj_123' }))
			})

			it('should throw error when subscription ID is missing from invoice.paid', async () => {
				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							parent: {
								subscription_details: {
									subscription: null
								}
							},
							lines: {
								data: [
									{
										pricing: { price_details: { price: 'price_123' } },
										period: { start: 0, end: MOCK_INVOICE_PERIOD_END }
									}
								]
							}
						}
					}
				}

				await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)).rejects.toThrow(
					'invoice.paid: Subscription missing from invoice'
				)
			})

			it('should throw error when price ID is missing from invoice line item', async () => {
				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							parent: {
								subscription_details: {
									subscription: 'sub_123'
								}
							},
							lines: {
								data: [
									{
										pricing: { price_details: { price: null } },
										period: { start: 0, end: MOCK_INVOICE_PERIOD_END }
									}
								]
							}
						}
					}
				}

				await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)).rejects.toThrow(
					'invoice.paid: Price ID missing from invoice line item'
				)
			})

			it('should throw error when period end is missing from invoice line item', async () => {
				const mockProduct = { id: 'product-123', externalPriceId: 'price_123' }

				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							parent: {
								subscription_details: {
									subscription: 'sub_123'
								}
							},
							lines: {
								data: [
									{
										pricing: { price_details: { price: 'price_123' } },
										period: { start: 0, end: 0 }
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(mockProduct)

				await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)).rejects.toThrow(
					'invoice.paid: Period end missing from invoice line item'
				)
			})

			it('should handle invoice.paid with no line items', async () => {
				mockReq.billingEvent = {
					type: 'invoice.paid',
					data: {
						object: {
							customer_email: 'test@example.com',
							customer: 'cus_123',
							lines: {
								data: []
							}
						}
					}
				}

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockProductRepository.getProductByExternalPriceId).not.toHaveBeenCalled()
				expect(mockBillingService.registerUserBilling).not.toHaveBeenCalled()
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})
		})

		describe('invoice.payment_failed event', () => {
			it('should process invoice.payment_failed event successfully', async () => {
				mockReq.billingEvent = {
					type: 'invoice.payment_failed',
					data: {
						object: {
							customer: 'cus_123',
							id: 'in_failed_123',
							status: 'open',
							lines: {
								data: [
									{
										subscription: 'sub_123'
									}
								]
							}
						}
					}
				}

				mockBillingService.updateBillingOnPaymentFailed.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockBillingService.updateBillingOnPaymentFailed).toHaveBeenCalledWith({ externalSubscriptionId: 'sub_123' })
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})

			it('should throw error when subscription ID is missing', async () => {
				mockReq.billingEvent = {
					type: 'invoice.payment_failed',
					data: {
						object: {
							customer: 'cus_123',
							id: 'in_failed_123',
							status: 'open',
							lines: {
								data: [
									{
										subscription: ''
									}
								]
							}
						}
					}
				}

				await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)).rejects.toThrow(
					'invoice.payment_failed: Subscription missing from invoice line item'
				)
			})
		})

		describe('customer.subscription.updated event', () => {
			it('should process subscription updated with cancel_at_period_end', async () => {
				const mockProduct = { id: 'product-123', name: 'Test Product' }

				mockReq.billingEvent = {
					type: 'customer.subscription.updated',
					data: {
						object: {
							id: 'sub_123',
							status: 'active',
							cancel_at_period_end: true,
							cancel_at: MOCK_INVOICE_PERIOD_END,
							items: {
								data: [
									{
										current_period_end: MOCK_SUBSCRIPTION_CURRENT_PERIOD_END,
										price: { id: 'price_123' }
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(mockProduct)
				mockBillingService.updateBillingOnSubscriptionUpdated.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockProductRepository.getProductByExternalPriceId).toHaveBeenCalledWith({ priceId: 'price_123' })
				expect(mockBillingService.updateBillingOnSubscriptionUpdated).toHaveBeenCalledWith({
					externalSubscriptionId: 'sub_123',
					productId: 'product-123',
					status: 'active',
					currentPeriodEnd: unixTimestampToDate(MOCK_INVOICE_PERIOD_END)
				})
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})

			it('should process subscription updated without cancel_at_period_end', async () => {
				const mockProduct = { id: 'product-123', name: 'Test Product' }

				mockReq.billingEvent = {
					type: 'customer.subscription.updated',
					data: {
						object: {
							id: 'sub_123',
							status: 'active',
							cancel_at_period_end: false,
							items: {
								data: [
									{
										current_period_end: MOCK_SUBSCRIPTION_CURRENT_PERIOD_END,
										price: { id: 'price_123' }
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(mockProduct)
				mockBillingService.updateBillingOnSubscriptionUpdated.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockBillingService.updateBillingOnSubscriptionUpdated).toHaveBeenCalledWith({
					externalSubscriptionId: 'sub_123',
					productId: 'product-123',
					status: 'active',
					currentPeriodEnd: unixTimestampToDate(MOCK_SUBSCRIPTION_CURRENT_PERIOD_END)
				})
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})

			it('should process subscription updated with unknown price ID', async () => {
				mockReq.billingEvent = {
					type: 'customer.subscription.updated',
					data: {
						object: {
							id: 'sub_123',
							status: 'active',
							cancel_at_period_end: false,
							items: {
								data: [
									{
										current_period_end: MOCK_SUBSCRIPTION_CURRENT_PERIOD_END,
										price: { id: 'price_unknown' }
									}
								]
							}
						}
					}
				}

				mockProductRepository.getProductByExternalPriceId.mockResolvedValue(null)
				mockBillingService.updateBillingOnSubscriptionUpdated.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockBillingService.updateBillingOnSubscriptionUpdated).toHaveBeenCalledWith({
					externalSubscriptionId: 'sub_123',
					productId: undefined,
					status: 'active',
					currentPeriodEnd: unixTimestampToDate(MOCK_SUBSCRIPTION_CURRENT_PERIOD_END)
				})
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})

			it('should throw error when subscription items missing current_period_end', async () => {
				mockReq.billingEvent = {
					type: 'customer.subscription.updated',
					data: {
						object: {
							id: 'sub_123',
							status: 'active',
							cancel_at_period_end: false,
							items: {
								data: []
							}
						}
					}
				}

				await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)).rejects.toThrow(
					'subscription.updated: Subscription item missing current_period_end'
				)
			})
		})

		describe('customer.subscription.deleted event', () => {
			it('should process subscription deleted event successfully', async () => {
				mockReq.billingEvent = {
					type: 'customer.subscription.deleted',
					data: {
						object: {
							id: 'sub_123',
							customer: 'cus_123'
						}
					}
				}

				mockBillingService.updateBillingOnSubscriptionDeleted.mockResolvedValue(undefined)

				await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

				expect(mockBillingService.updateBillingOnSubscriptionDeleted).toHaveBeenCalledWith({ externalSubscriptionId: 'sub_123' })
				expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
				expect(mockRes.json).toHaveBeenCalledWith({ received: true })
			})
		})

		it('should handle unknown event types', async () => {
			mockReq.billingEvent = {
				type: 'unknown.event',
				data: {
					object: {}
				}
			}

			await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

			expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
			expect(mockRes.json).toHaveBeenCalledWith({ received: true })
		})
	})
})
