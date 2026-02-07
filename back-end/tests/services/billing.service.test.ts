import {
	registerUserBilling,
	updateBillingOnPaymentFailed,
	updateBillingOnSubscriptionUpdated,
	updateBillingOnSubscriptionDeleted
} from '../../src/services/billing.service'
import { IUpdateUserBillingInput } from '../../src/types/billing'
import db from '../../src/database/knex'
import * as userRepository from '../../src/database/repositories/user.repository'
import * as billingRepository from '../../src/database/repositories/billing.repository'
import * as productRepository from '../../src/database/repositories/product.repository'

jest.mock('../../src/database/knex', () => ({
	__esModule: true,
	default: {
		transaction: jest.fn((callback: (trx: any) => Promise<any>) => callback(jest.fn()))
	}
}))
jest.mock('../../src/database/repositories/user.repository')
jest.mock('../../src/database/repositories/billing.repository')
jest.mock('../../src/database/repositories/product.repository')

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockBillingRepository = billingRepository as jest.Mocked<typeof billingRepository>
const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>

describe('Billing Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		;(db.transaction as jest.Mock).mockImplementation((callback: (trx: any) => Promise<any>) => callback(jest.fn()))
	})

	describe('registerUserBilling', () => {
		const billingInput: IUpdateUserBillingInput = {
			userEmail: 'test@example.com',
			productId: 'product-123',
			externalCustomerId: 'cus_123',
			externalSubscriptionId: 'sub_123',
			expiresAt: 1640995200
		}

		it('should create new billing when user exists and has no billing', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				fullName: 'Test User',
				emailVerified: true
			}

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockBillingRepository.createBilling.mockResolvedValue({})
			mockUserRepository.updateUserById.mockResolvedValue(mockUser)

			await registerUserBilling(billingInput)

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: billingInput.userEmail })
			expect(mockBillingRepository.getBillingByUserId).toHaveBeenCalledWith({ userId: mockUser.id })
			expect(mockBillingRepository.createBilling).toHaveBeenCalledWith(
				{
					userId: mockUser.id,
					productId: billingInput.productId,
					externalSubscriptionId: billingInput.externalSubscriptionId,
					externalCustomerId: billingInput.externalCustomerId,
					status: 'active',
					expiresAt: new Date(billingInput.expiresAt * 1000)
				},
				expect.any(Function)
			)
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith(
				{
					id: mockUser.id,
					updates: { productId: billingInput.productId }
				},
				expect.any(Function)
			)
		})

		it('should update existing billing when user has billing', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				fullName: 'Test User',
				emailVerified: true
			}

			const mockBilling = {
				id: 'billing-123',
				userId: mockUser.id,
				status: 'active'
			}

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(mockBilling)
			mockBillingRepository.updateBillingById.mockResolvedValue({})
			mockUserRepository.updateUserById.mockResolvedValue(mockUser)

			await registerUserBilling(billingInput)

			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith(
				{
					id: mockBilling.id,
					updates: {
						productId: billingInput.productId,
						externalSubscriptionId: billingInput.externalSubscriptionId,
						externalCustomerId: billingInput.externalCustomerId,
						status: 'active',
						expiresAt: new Date(billingInput.expiresAt * 1000)
					}
				},
				expect.any(Function)
			)
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith(
				{
					id: mockUser.id,
					updates: { productId: billingInput.productId }
				},
				expect.any(Function)
			)
			expect(mockBillingRepository.createBilling).not.toHaveBeenCalled()
		})

		it('should throw error when user is not found', async () => {
			mockUserRepository.getUserByEmail.mockResolvedValue(null)

			await expect(registerUserBilling(billingInput)).rejects.toThrow(`User with email "${billingInput.userEmail}" not found`)

			expect(mockBillingRepository.createBilling).not.toHaveBeenCalled()
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})

	describe('updateBillingOnPaymentFailed', () => {
		it('should update billing status to past_due when subscription exists', async () => {
			const mockBilling = {
				id: 'billing-123',
				externalSubscriptionId: 'sub_123',
				status: 'active'
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling)
			mockBillingRepository.updateBillingById.mockResolvedValue({})

			await updateBillingOnPaymentFailed({ externalSubscriptionId: 'sub_123' })

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId: 'sub_123' })
			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith({
				id: mockBilling.id,
				updates: { status: 'past_due' }
			})
		})

		it('should do nothing when externalSubscriptionId is empty', async () => {
			await updateBillingOnPaymentFailed({ externalSubscriptionId: '' })

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).not.toHaveBeenCalled()
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})

		it('should do nothing when billing is not found', async () => {
			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(null)

			await updateBillingOnPaymentFailed({ externalSubscriptionId: 'sub_nonexistent' })

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId: 'sub_nonexistent' })
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})

	describe('updateBillingOnSubscriptionUpdated', () => {
		it('should update billing with status and expiration date', async () => {
			const input = {
				externalSubscriptionId: 'sub_123',
				productId: 'product-123',
				status: 'active',
				currentPeriodEnd: new Date('2024-12-31')
			}

			const mockBilling = {
				id: 'billing-123',
				userId: 'user-123',
				externalSubscriptionId: input.externalSubscriptionId,
				productId: 'old-product',
				status: 'past_due'
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling)
			mockBillingRepository.updateBillingById.mockResolvedValue({})
			mockUserRepository.updateUserById.mockResolvedValue({})

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith(
				{
					id: mockBilling.id,
					updates: {
						productId: input.productId,
						status: input.status,
						expiresAt: input.currentPeriodEnd
					}
				},
				expect.any(Function)
			)
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith(
				{
					id: mockBilling.userId,
					updates: { productId: input.productId }
				},
				expect.any(Function)
			)
		})

		it('should update billing without status or productId when not provided', async () => {
			const input = {
				externalSubscriptionId: 'sub_123',
				currentPeriodEnd: new Date('2024-12-31')
			}

			const mockBilling = {
				id: 'billing-123',
				userId: 'user-123',
				externalSubscriptionId: input.externalSubscriptionId,
				status: 'active'
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling)
			mockBillingRepository.updateBillingById.mockResolvedValue({})

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith(
				{
					id: mockBilling.id,
					updates: {
						expiresAt: input.currentPeriodEnd
					}
				},
				expect.any(Function)
			)
			expect(mockUserRepository.updateUserById).not.toHaveBeenCalled()
		})

		it('should downgrade to free tier on canceled status', async () => {
			const input = {
				externalSubscriptionId: 'sub_123',
				status: 'canceled',
				currentPeriodEnd: new Date('2024-12-31')
			}

			const mockBilling = {
				id: 'billing-123',
				userId: 'user-123',
				externalSubscriptionId: input.externalSubscriptionId,
				status: 'active'
			}

			const mockFreeTierProduct = { id: 'free-product-id', name: 'Free Tier' }

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling)
			mockBillingRepository.updateBillingById.mockResolvedValue({})
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct)
			mockUserRepository.updateUserById.mockResolvedValue({})

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockProductRepository.getFreeTierProduct).toHaveBeenCalled()
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith(
				{
					id: mockBilling.userId,
					updates: { productId: mockFreeTierProduct.id }
				},
				expect.any(Function)
			)
		})

		it('should do nothing when externalSubscriptionId is empty', async () => {
			await updateBillingOnSubscriptionUpdated({
				externalSubscriptionId: '',
				status: 'active',
				currentPeriodEnd: new Date('2024-12-31')
			})

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).not.toHaveBeenCalled()
		})

		it('should do nothing when billing is not found', async () => {
			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(null)

			await updateBillingOnSubscriptionUpdated({
				externalSubscriptionId: 'sub_nonexistent',
				status: 'active',
				currentPeriodEnd: new Date('2024-12-31')
			})

			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})

	describe('updateBillingOnSubscriptionDeleted', () => {
		it('should update billing status to canceled and set expiration to now', async () => {
			const mockBilling = {
				id: 'billing-123',
				userId: 'user-123',
				externalSubscriptionId: 'sub_123',
				status: 'active'
			}

			const mockFreeTierProduct = { id: 'free-product-id', name: 'Free Tier' }

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling)
			mockBillingRepository.updateBillingById.mockResolvedValue({})
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct)
			mockUserRepository.updateUserById.mockResolvedValue({})

			await updateBillingOnSubscriptionDeleted({ externalSubscriptionId: 'sub_123' })

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId: 'sub_123' })
			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith(
				{
					id: mockBilling.id,
					updates: {
						status: 'canceled',
						expiresAt: expect.any(Date)
					}
				},
				expect.any(Function)
			)
			expect(mockProductRepository.getFreeTierProduct).toHaveBeenCalled()
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith(
				{
					id: mockBilling.userId,
					updates: { productId: mockFreeTierProduct.id }
				},
				expect.any(Function)
			)
		})

		it('should do nothing when externalSubscriptionId is empty', async () => {
			await updateBillingOnSubscriptionDeleted({ externalSubscriptionId: '' })

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).not.toHaveBeenCalled()
		})

		it('should do nothing when billing is not found', async () => {
			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(null)

			await updateBillingOnSubscriptionDeleted({ externalSubscriptionId: 'sub_nonexistent' })

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId: 'sub_nonexistent' })
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})
})
