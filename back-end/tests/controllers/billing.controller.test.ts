import { Request, Response } from 'express'
import { processBillingWebhookHandler } from '../../src/controllers/billing.controller'
import { BillingRequest } from '../../src/middlewares/billing.middleware'
import * as productRepository from '../../src/database/repositories/product.repository'
import * as billingService from '../../src/services/billing.service'
import { StatusCodes } from '../../src/utils/status-codes'
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
    let mockReq: Partial<BillingRequest>
    let mockRes: Partial<Response>
    let mockNext: jest.Mock

    beforeEach(() => {
        mockReq = {}
        mockRes = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
        mockNext = jest.fn()

        jest.clearAllMocks()
    })

    describe('processBillingWebhookHandler', () => {
        it('should throw error when billingEvent is missing', async () => {
            mockReq.billingEvent = undefined

            await expect(processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response))
                .rejects.toThrow('req.billingEvent is missing in processBillingWebhookHandler')
        })

        describe('invoice.paid event', () => {
            it('should process invoice.paid event successfully', async () => {
                const mockProduct = {
                    id: 'product-123',
                    name: 'Test Product',
                    externalProductId: 'prod_external_123'
                }

                mockReq.billingEvent = {
                    type: 'invoice.paid',
                    data: {
                        object: {
                            customer_email: 'test@example.com',
                            customer: 'cus_123',
                            payment_intent: 'pi_test123',
                            lines: {
                                data: [{
                                    pricing: {
                                        price_details: {
                                            product: 'prod_external_123'
                                        }
                                    },
                                    subscription: 'sub_123',
                                    period: {
                                        end: MOCK_INVOICE_PERIOD_END
                                    }
                                }]
                            }
                        }
                    }
                } as any

                mockProductRepository.getProductByExternalProductId.mockResolvedValue(mockProduct as any)
                mockBillingService.registerUserBilling.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

                expect(mockProductRepository.getProductByExternalProductId).toHaveBeenCalledWith({
                    id: 'prod_external_123'
                })
                expect(mockBillingService.registerUserBilling).toHaveBeenCalledWith({
                    userEmail: 'test@example.com',
                    productId: 'product-123',
                    externalCustomerId: 'cus_123',
                    externalSubscriptionId: 'sub_123',
                    expiresAt: MOCK_INVOICE_PERIOD_END,
                })
                expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
                expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
            })

            it('should throw error when product is not found', async () => {
                mockReq.billingEvent = {
                    type: 'invoice.paid',
                    data: {
                        object: {
                            customer_email: 'test@example.com',
                            customer: 'cus_123',
                            lines: {
                                data: [{
                                    pricing: {
                                        price_details: {
                                            product: 'prod_nonexistent'
                                        }
                                    },
                                    subscription: 'sub_123',
                                    period: {
                                        end: MOCK_INVOICE_PERIOD_END
                                    }
                                }]
                            }
                        }
                    }
                } as any

                mockProductRepository.getProductByExternalProductId.mockResolvedValue(null)

                await expect(processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response))
                    .rejects.toThrow('Product with external ID "prod_nonexistent" not found')
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
                } as any

                await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

                expect(mockProductRepository.getProductByExternalProductId).not.toHaveBeenCalled()
                expect(mockBillingService.registerUserBilling).not.toHaveBeenCalled()
                expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
                expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
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
                                data: [{
                                    subscription: 'sub_123'
                                }]
                            }
                        }
                    }
                } as any

                mockBillingService.updateBillingOnPaymentFailed.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnPaymentFailed).toHaveBeenCalledWith('sub_123')
                expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
                expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
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
                                data: [{
                                    subscription: ''
                                }]
                            }
                        }
                    }
                } as any

                await expect(processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response))
                    .rejects.toThrow('Subscription missing from invoice line item')
            })
        })

        describe('customer.subscription.updated event', () => {
            it('should process subscription updated with cancel_at_period_end', async () => {
                mockReq.billingEvent = {
                    type: 'customer.subscription.updated',
                    data: {
                        object: {
                            id: 'sub_123',
                            status: 'active',
                            cancel_at_period_end: true,
                            cancel_at: MOCK_INVOICE_PERIOD_END,
                            items: {
                                data: [{
                                    current_period_end: MOCK_SUBSCRIPTION_CURRENT_PERIOD_END
                                }]
                            }
                        }
                    }
                } as any

                mockBillingService.updateBillingOnSubscriptionUpdated.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnSubscriptionUpdated).toHaveBeenCalledWith({
                    externalSubscriptionId: 'sub_123',
                    status: 'active',
                    currentPeriodEnd: unixTimestampToDate(MOCK_INVOICE_PERIOD_END)
                })
                expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
            })

            it('should process subscription updated without cancel_at_period_end', async () => {
                mockReq.billingEvent = {
                    type: 'customer.subscription.updated',
                    data: {
                        object: {
                            id: 'sub_123',
                            status: 'active',
                            cancel_at_period_end: false,
                            items: {
                                data: [{
                                    current_period_end: MOCK_SUBSCRIPTION_CURRENT_PERIOD_END
                                }]
                            }
                        }
                    }
                } as any

                mockBillingService.updateBillingOnSubscriptionUpdated.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnSubscriptionUpdated).toHaveBeenCalledWith({
                    externalSubscriptionId: 'sub_123',
                    status: 'active',
                    currentPeriodEnd: unixTimestampToDate(MOCK_SUBSCRIPTION_CURRENT_PERIOD_END)
                })
                expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
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
                } as any

                await expect(processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response))
                    .rejects.toThrow('Subscription item missing current_period_end')
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
                } as any

                mockBillingService.updateBillingOnSubscriptionDeleted.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnSubscriptionDeleted).toHaveBeenCalledWith('sub_123')
                expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
                expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
            })
        })

        it('should handle unknown event types', async () => {
            mockReq.billingEvent = {
                type: 'unknown.event',
                data: {
                    object: {}
                }
            } as any

            await processBillingWebhookHandler(mockReq as BillingRequest, mockRes as Response)

            expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK)
            expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
        })
    })
})