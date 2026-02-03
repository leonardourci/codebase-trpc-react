import {
	registerUserBilling,
	updateBillingOnPaymentFailed,
	updateBillingOnSubscriptionUpdated,
	updateBillingOnSubscriptionDeleted,
	IUpdateUserBillingInput
} from '../../src/services/billing.service'
import * as userRepository from '../../src/database/repositories/user.repository'
import * as billingRepository from '../../src/database/repositories/billing.repository'
import * as productRepository from '../../src/database/repositories/product.repository'

jest.mock('../../src/database/repositories/user.repository')
jest.mock('../../src/database/repositories/billing.repository')
jest.mock('../../src/database/repositories/product.repository')

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockBillingRepository = billingRepository as jest.Mocked<typeof billingRepository>
const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>

describe('Billing Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('registerUserBilling', () => {
		const billingInput: IUpdateUserBillingInput = {
			userEmail: 'test@example.com',
			productId: 'product-123',
			externalCustomerId: 'cus_123',
			externalSubscriptionId: 'sub_123',
			expiresAt: 1640995200 // timestamp
		}

		it('should create new billing when user exists and has no billing', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				fullName: 'Test User',
				emailVerified: true
			}

			const mockCreatedBilling = {
				id: 'billing-123',
				userId: mockUser.id,
				productId: billingInput.productId,
				status: 'active',
				externalSubscriptionId: billingInput.externalSubscriptionId,
				externalCustomerId: billingInput.externalCustomerId,
				expiresAt: new Date(billingInput.expiresAt * 1000),
				createdAt: new Date(),
				updatedAt: new Date()
			}

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser as any)
			mockUserRepository.getUserById.mockResolvedValue(mockUser as any)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockBillingRepository.createBilling.mockResolvedValue(mockCreatedBilling as any)
			mockUserRepository.updateUserById.mockResolvedValue(mockUser as any)

			await registerUserBilling(billingInput)

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: billingInput.userEmail })
			expect(mockBillingRepository.getBillingByUserId).toHaveBeenCalledWith({ userId: mockUser.id })
			expect(mockBillingRepository.createBilling).toHaveBeenCalledWith({
				userId: mockUser.id,
				productId: billingInput.productId,
				externalSubscriptionId: billingInput.externalSubscriptionId,
				externalCustomerId: billingInput.externalCustomerId,
				status: 'active',
				expiresAt: new Date(billingInput.expiresAt * 1000)
			})
			expect(mockBillingRepository.updateBillingByUserId).not.toHaveBeenCalled()
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

			const mockUpdatedBilling = {
				...mockBilling,
				expiresAt: new Date(billingInput.expiresAt * 1000),
				updatedAt: new Date()
			}

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser as any)
			mockUserRepository.getUserById.mockResolvedValue(mockUser as any)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(mockBilling as any)
			mockBillingRepository.updateBillingByUserId.mockResolvedValue(mockUpdatedBilling as any)
			mockUserRepository.updateUserById.mockResolvedValue(mockUser as any)

			await registerUserBilling(billingInput)

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: billingInput.userEmail })
			expect(mockBillingRepository.getBillingByUserId).toHaveBeenCalledWith({ userId: mockUser.id })
			expect(mockBillingRepository.updateBillingByUserId).toHaveBeenCalledWith({
				id: mockBilling.id,
				expiresAt: new Date(billingInput.expiresAt * 1000)
			})
			expect(mockBillingRepository.createBilling).not.toHaveBeenCalled()
		})

		it('should throw error when user is not found', async () => {
			mockUserRepository.getUserByEmail.mockResolvedValue(null)

			await expect(registerUserBilling(billingInput)).rejects.toThrow(`User with email "${billingInput.userEmail}" not found`)

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: billingInput.userEmail })
			expect(mockBillingRepository.getBillingByUserId).not.toHaveBeenCalled()
			expect(mockBillingRepository.createBilling).not.toHaveBeenCalled()
			expect(mockBillingRepository.updateBillingByUserId).not.toHaveBeenCalled()
		})
	})

	describe('updateBillingOnPaymentFailed', () => {
		it('should update billing status to past_due when subscription exists', async () => {
			const externalSubscriptionId = 'sub_123'
			const mockBilling = {
				id: 'billing-123',
				externalSubscriptionId,
				status: 'active'
			}

			const mockUpdatedBilling = {
				...mockBilling,
				status: 'past_due',
				updatedAt: new Date()
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling as any)
			mockBillingRepository.updateBillingById.mockResolvedValue(mockUpdatedBilling as any)

			await updateBillingOnPaymentFailed(externalSubscriptionId)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId })
			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith({
				id: mockBilling.id,
				status: 'past_due'
			})
		})

		it('should do nothing when externalSubscriptionId is empty', async () => {
			await updateBillingOnPaymentFailed('')

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).not.toHaveBeenCalled()
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})

		it('should do nothing when billing is not found', async () => {
			const externalSubscriptionId = 'sub_nonexistent'

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(null)

			await updateBillingOnPaymentFailed(externalSubscriptionId)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId })
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})

	describe('updateBillingOnSubscriptionUpdated', () => {
		it('should update billing with status and expiration date', async () => {
			const input = {
				externalSubscriptionId: 'sub_123',
				status: 'active',
				currentPeriodEnd: new Date('2024-12-31')
			}

			const mockBilling = {
				id: 'billing-123',
				externalSubscriptionId: input.externalSubscriptionId,
				status: 'past_due'
			}

			const mockUpdatedBilling = {
				...mockBilling,
				status: input.status,
				expiresAt: input.currentPeriodEnd,
				updatedAt: new Date()
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling as any)
			mockBillingRepository.updateBillingById.mockResolvedValue(mockUpdatedBilling as any)

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({
				externalSubscriptionId: input.externalSubscriptionId
			})
			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith({
				id: mockBilling.id,
				status: input.status,
				expiresAt: input.currentPeriodEnd
			})
		})

		it('should update billing without status when not provided', async () => {
			const input = {
				externalSubscriptionId: 'sub_123',
				currentPeriodEnd: new Date('2024-12-31')
			}

			const mockBilling = {
				id: 'billing-123',
				externalSubscriptionId: input.externalSubscriptionId,
				status: 'active'
			}

			const mockUpdatedBilling = {
				...mockBilling,
				expiresAt: input.currentPeriodEnd,
				updatedAt: new Date()
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling as any)
			mockBillingRepository.updateBillingById.mockResolvedValue(mockUpdatedBilling as any)

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith({
				id: mockBilling.id,
				status: undefined,
				expiresAt: input.currentPeriodEnd
			})
		})

		it('should do nothing when externalSubscriptionId is empty', async () => {
			const input = {
				externalSubscriptionId: '',
				status: 'active',
				currentPeriodEnd: new Date('2024-12-31')
			}

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).not.toHaveBeenCalled()
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})

		it('should do nothing when billing is not found', async () => {
			const input = {
				externalSubscriptionId: 'sub_nonexistent',
				status: 'active',
				currentPeriodEnd: new Date('2024-12-31')
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(null)

			await updateBillingOnSubscriptionUpdated(input)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({
				externalSubscriptionId: input.externalSubscriptionId
			})
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})

	describe('updateBillingOnSubscriptionDeleted', () => {
		it('should update billing status to canceled and set expiration to now', async () => {
			const externalSubscriptionId = 'sub_123'
			const mockBilling = {
				id: 'billing-123',
				userId: 'user-123',
				externalSubscriptionId,
				status: 'active'
			}

			const mockFreeTierProduct = {
				id: 'free-tier-product-id',
				name: 'Free Tier'
			}

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(mockBilling as any)
			mockBillingRepository.updateBillingById.mockResolvedValue({ ...mockBilling, status: 'canceled' } as any)
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct as any)
			mockUserRepository.updateUserById.mockResolvedValue({} as any)

			await updateBillingOnSubscriptionDeleted(externalSubscriptionId)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId })
			expect(mockBillingRepository.updateBillingById).toHaveBeenCalledWith({
				id: mockBilling.id,
				status: 'canceled',
				expiresAt: expect.any(Date)
			})
			expect(mockProductRepository.getFreeTierProduct).toHaveBeenCalled()
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: mockBilling.userId,
				updates: { productId: mockFreeTierProduct.id }
			})
		})

		it('should do nothing when externalSubscriptionId is empty', async () => {
			await updateBillingOnSubscriptionDeleted('')

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).not.toHaveBeenCalled()
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})

		it('should do nothing when billing is not found', async () => {
			const externalSubscriptionId = 'sub_nonexistent'

			mockBillingRepository.getBillingByExternalSubscriptionId.mockResolvedValue(null)

			await updateBillingOnSubscriptionDeleted(externalSubscriptionId)

			expect(mockBillingRepository.getBillingByExternalSubscriptionId).toHaveBeenCalledWith({ externalSubscriptionId })
			expect(mockBillingRepository.updateBillingById).not.toHaveBeenCalled()
		})
	})
})
