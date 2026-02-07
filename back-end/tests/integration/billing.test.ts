import { createTestClient, createAuthenticatedTestClient } from '../setup/test-client'
import { startTestServer, stopTestServer } from '../setup/test-server'
import { cleanTestData, closeTestDb, getTestDb, seedFreeTierProduct } from '../setup/test-db'
import type { TSignupInput } from '../../src/types/auth'
import type { TCreateCheckoutSessionInput, TCreatePortalSessionInput } from '../../src/types/billing'
import { createBilling, getBillingByUserId } from '../../src/database/repositories/billing.repository'
import { createUser } from '../../src/database/repositories/user.repository'
import { IProduct, IProductDbRow } from '../../src/types/product'
import { keysToSnakeCase, keysToCamelCase } from '../../src/utils/case-conversion'
import { mockStripe, setupStripeMocks, resetStripeMocks } from '../mocks/stripe.mock'

jest.mock('../../src/utils/stripe', () => require('../mocks/stripe.mock').mockStripe)

describe('Billing Integration Tests', () => {
	let baseUrl: string
	let testClient: ReturnType<typeof createTestClient>
	let authenticatedClient: ReturnType<typeof createAuthenticatedTestClient>
	let validToken: string
	let testUser: any
	let testProduct: any

	beforeAll(async () => {
		const db = getTestDb()
		await db.migrate.latest()

		baseUrl = await startTestServer()
		testClient = createTestClient(baseUrl)
	})

	afterAll(async () => {
		await stopTestServer()
		await closeTestDb()
	})

	beforeEach(async () => {
		await cleanTestData()
		await seedFreeTierProduct()

		setupStripeMocks()

		const userData: TSignupInput = {
			fullName: 'Test User',
			email: 'test@example.com',
			phone: '+1234567890',
			password: 'testPassword123',
			age: 30
		}

		const signupResponse = await testClient.auth.signup.mutate(userData)
		testUser = signupResponse

		// Mark email as verified for billing tests
		const db = getTestDb()
		await db('users').where({ id: testUser.id }).update({ email_verified: true })

		const loginResponse = await testClient.auth.login.mutate({
			email: userData.email,
			password: userData.password
		})
		validToken = loginResponse.accessToken
		authenticatedClient = createAuthenticatedTestClient(baseUrl, validToken)

		const productData: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> = {
			name: 'Test Product',
			description: 'A test product for billing tests',
			priceInCents: 2999,
			externalProductId: 'prod_test123',
			externalPriceId: 'price_test123',
			active: true
		}

		const dbData = keysToSnakeCase<typeof productData, Partial<IProductDbRow>>(productData)
		const [insertedRow] = await db('products').insert(dbData).returning('*')

		testProduct = keysToCamelCase<IProductDbRow, IProduct>(insertedRow)
	})

	afterEach(async () => {
		resetStripeMocks()
	})

	describe('Checkout Session Creation', () => {
		it('should successfully create checkout session with valid product', async () => {
			const checkoutData: TCreateCheckoutSessionInput = {
				priceId: testProduct.externalPriceId,
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel'
			}

			const response = await authenticatedClient.billing.createCheckoutSession.mutate(checkoutData)

			expect(response).toBeDefined()
			expect(response.id).toBe('cs_test_123')
			expect(response.url).toBe('https://checkout.stripe.com/pay/cs_test_123')
			expect(mockStripe.checkout.sessions.create).toHaveBeenCalledTimes(1)
		})

		it('should reject checkout session creation with non-existent product', async () => {
			const checkoutData: TCreateCheckoutSessionInput = {
				priceId: 'non-existent-price-id',
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel'
			}

			await expect(authenticatedClient.billing.createCheckoutSession.mutate(checkoutData)).rejects.toThrow()
		})

		it('should reject checkout session creation with invalid URLs', async () => {
			const checkoutData: TCreateCheckoutSessionInput = {
				priceId: testProduct.externalPriceId,
				successUrl: 'invalid-url',
				cancelUrl: 'invalid-url'
			}

			await expect(authenticatedClient.billing.createCheckoutSession.mutate(checkoutData)).rejects.toThrow()
		})

		it('should reject checkout session creation without authentication', async () => {
			const checkoutData: TCreateCheckoutSessionInput = {
				priceId: testProduct.externalPriceId,
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel'
			}

			await expect(testClient.billing.createCheckoutSession.mutate(checkoutData)).rejects.toThrow()
		})
	})

	describe('Customer Portal Session Creation', () => {
		beforeEach(async () => {
			await createBilling({
				userId: testUser.id,
				productId: testProduct.id,
				externalSubscriptionId: 'sub_test123',
				externalCustomerId: 'cus_test123',
				status: 'active',
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
			})
		})

		it('should successfully create customer portal session for user with billing', async () => {
			const portalData: TCreatePortalSessionInput = {
				returnUrl: 'https://example.com/dashboard'
			}

			const response = await authenticatedClient.billing.createCustomerPortalSession.mutate(portalData)

			expect(response).toBeDefined()
			expect(response.url).toBe('https://billing.stripe.com/session/test_123')
			expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledTimes(1)
		})

		it('should reject portal session creation for user without billing', async () => {
			await cleanTestData()
			await seedFreeTierProduct()

			// Recreate user and auth but no billing
			const userData: TSignupInput = {
				fullName: 'Test User No Billing',
				email: 'nobilling@example.com',
				phone: '+1234567890',
				password: 'testPassword123',
				age: 30
			}

			await testClient.auth.signup.mutate(userData)
			const loginResponse = await testClient.auth.login.mutate({
				email: userData.email,
				password: userData.password
			})
			const noBillingClient = createAuthenticatedTestClient(baseUrl, loginResponse.accessToken)

			const portalData: TCreatePortalSessionInput = {
				returnUrl: 'https://example.com/dashboard'
			}

			await expect(noBillingClient.billing.createCustomerPortalSession.mutate(portalData)).rejects.toThrow()
		})

		it('should reject portal session creation with invalid return URL', async () => {
			const portalData: TCreatePortalSessionInput = {
				returnUrl: 'invalid-url'
			}

			await expect(authenticatedClient.billing.createCustomerPortalSession.mutate(portalData)).rejects.toThrow()
		})

		it('should reject portal session creation without authentication', async () => {
			const portalData: TCreatePortalSessionInput = {
				returnUrl: 'https://example.com/dashboard'
			}

			await expect(testClient.billing.createCustomerPortalSession.mutate(portalData)).rejects.toThrow()
		})
	})

	describe('Billing Data Retrieval', () => {
		let testBilling: any

		beforeEach(async () => {
			testBilling = await createBilling({
				userId: testUser.id,
				productId: testProduct.id,
				externalSubscriptionId: 'sub_test456',
				externalCustomerId: 'cus_test456',
				status: 'active',
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
			})
		})

		it('should successfully retrieve billing data for authenticated user', async () => {
			const billing = await getBillingByUserId({ userId: testUser.id })

			expect(billing).toBeDefined()
			expect(billing!.id).toBe(testBilling.id)
			expect(billing!.userId).toBe(testUser.id)
			expect(billing!.productId).toBe(testProduct.id)
			expect(billing!.status).toBe('active')
			expect(billing!.externalCustomerId).toBe('cus_test456')
			expect(billing!.externalSubscriptionId).toBe('sub_test456')
		})

		it('should return null for user without billing data', async () => {
			// Create another user without billing
			const newUser = await createUser({
				fullName: 'No Billing User',
				email: 'nobilling2@example.com',
				phone: '+1987654321',
				passwordHash: 'hashedpassword',
				age: 25
			})

			const billing = await getBillingByUserId({ userId: newUser.id })

			expect(billing).toBeNull()
		})

		it('should validate billing data consistency after creation', async () => {
			const retrievedBilling = await getBillingByUserId({ userId: testUser.id })

			expect(retrievedBilling).toBeDefined()
			expect(retrievedBilling!.userId).toBe(testBilling.userId)
			expect(retrievedBilling!.productId).toBe(testBilling.productId)
			expect(retrievedBilling!.status).toBe(testBilling.status)
			expect(retrievedBilling!.externalCustomerId).toBe(testBilling.externalCustomerId)
			expect(retrievedBilling!.externalSubscriptionId).toBe(testBilling.externalSubscriptionId)
			expect(new Date(retrievedBilling!.expiresAt).getTime()).toBe(new Date(testBilling.expiresAt).getTime())
		})
	})

	describe('Billing Error Handling', () => {
		it('should handle missing product gracefully in checkout session', async () => {
			const checkoutData: TCreateCheckoutSessionInput = {
				priceId: '',
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel'
			}

			await expect(authenticatedClient.billing.createCheckoutSession.mutate(checkoutData)).rejects.toThrow()
		})

		it('should handle invalid token in checkout session', async () => {
			const invalidClient = createAuthenticatedTestClient(baseUrl, 'invalid-token')
			const checkoutData: TCreateCheckoutSessionInput = {
				priceId: testProduct.externalPriceId,
				successUrl: 'https://example.com/success',
				cancelUrl: 'https://example.com/cancel'
			}

			await expect(invalidClient.billing.createCheckoutSession.mutate(checkoutData)).rejects.toThrow()
		})

		it('should handle missing external customer ID in portal session', async () => {
			// Create billing without external customer ID
			await createBilling({
				userId: testUser.id,
				productId: testProduct.id,
				externalSubscriptionId: 'sub_test789',
				externalCustomerId: '',
				status: 'active',
				expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
			})

			const portalData: TCreatePortalSessionInput = {
				returnUrl: 'https://example.com/dashboard'
			}

			await expect(authenticatedClient.billing.createCustomerPortalSession.mutate(portalData)).rejects.toThrow()
		})
	})
})
