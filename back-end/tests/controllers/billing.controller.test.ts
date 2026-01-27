import { Request, Response } from 'express'
import { processBillingWebhookHandler } from '../../src/controllers/billing.controller'
import { IBillingRequest } from '../../src/middlewares/billing.middleware'
import * as productRepository from '../../src/database/repositories/product.repository'
import * as billingService from '../../src/services/billing.service'
import { EStatusCodes } from '../../src/utils/status-codes'

// Mock dependencies
jest.mock('../../src/database/repositories/product.repository')
jest.mock('../../src/services/billing.service')

const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>
const mockBillingService = billingService as jest.Mocked<typeof billingService>

describe('Billing Controller', () => {
    let mockReq: Partial<IBillingRequest>
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

            await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response))
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
                            lines: {
                                data: [{
                                    pricing: {
                                        price_details: {
                                            product: 'prod_external_123'
                                        }
                                    },
                                    subscription: 'sub_123',
                                    period: {
                                        end: 1640995200 // timestamp
                                    }
                                }]
                            }
                        }
                    }
                } as any

                mockProductRepository.getProductByExternalProductId.mockResolvedValue(mockProduct as any)
                mockBillingService.registerUserBilling.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockProductRepository.getProductByExternalProductId).toHaveBeenCalledWith({
                    id: 'prod_external_123'
                })
                expect(mockBillingService.registerUserBilling).toHaveBeenCalledWith({
                    userEmail: 'test@example.com',
                    productId: 'product-123',
                    externalCustomerId: 'cus_123',
                    externalSubscriptionId: 'sub_123',
                    expiresAt: 1640995200,
                    externalPaymentIntentId: expect.any(String)
                })
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
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
                                        end: 1640995200
                                    }
                                }]
                            }
                        }
                    }
                } as any

                mockProductRepository.getProductByExternalProductId.mockResolvedValue(null)

                await expect(processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response))
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

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockProductRepository.getProductByExternalProductId).not.toHaveBeenCalled()
                expect(mockBillingService.registerUserBilling).not.toHaveBeenCalled()
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
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

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnPaymentFailed).toHaveBeenCalledWith('sub_123')
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
                expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
            })

            it('should handle payment_failed with no subscription ID', async () => {
                mockReq.billingEvent = {
                    type: 'invoice.payment_failed',
                    data: {
                        object: {
                            customer: 'cus_123',
                            id: 'in_failed_123',
                            status: 'open',
                            lines: {
                                data: []
                            }
                        }
                    }
                } as any

                mockBillingService.updateBillingOnPaymentFailed.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnPaymentFailed).toHaveBeenCalledWith('')
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
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
                            cancel_at: 1640995200
                        }
                    }
                } as any

                mockBillingService.updateBillingOnSubscriptionUpdated.mockResolvedValue(undefined)

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnSubscriptionUpdated).toHaveBeenCalledWith({
                    externalSubscriptionId: 'sub_123',
                    status: 'active',
                    currentPeriodEnd: new Date(1640995200 * 1000)
                })
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
            })

            it('should process subscription updated without cancel_at_period_end', async () => {
                mockReq.billingEvent = {
                    type: 'customer.subscription.updated',
                    data: {
                        object: {
                            id: 'sub_123',
                            status: 'active',
                            cancel_at_period_end: false
                        }
                    }
                } as any

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnSubscriptionUpdated).not.toHaveBeenCalled()
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
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

                await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

                expect(mockBillingService.updateBillingOnSubscriptionDeleted).toHaveBeenCalledWith('sub_123')
                expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
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

            await processBillingWebhookHandler(mockReq as IBillingRequest, mockRes as Response)

            expect(mockRes.status).toHaveBeenCalledWith(EStatusCodes.OK)
            expect(mockRes.send).toHaveBeenCalledWith('Webhook processed successfully')
        })
    })
})