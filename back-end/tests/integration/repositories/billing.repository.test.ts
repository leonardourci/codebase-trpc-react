import { getTestDb, cleanTestData, closeTestDb, seedFreeTierProduct } from '../../setup/test-db'
import {
    createBilling,
    getBillingByUserId,
    updateBillingByUserId,
    getBillingByExternalSubscriptionId,
    updateBillingById
} from '../../../src/database/repositories/billing.repository'
import { createUser } from '../../../src/database/repositories/user.repository'
import { CreateBilling, Billing } from '../../../src/types/billing'
import { Product, ProductDbRow } from '../../../src/types/product'
import { keysToSnakeCase } from '../../../src/utils/case-conversion'

describe('Billing Repository', () => {
    let db: any
    let testUser: any
    let testProduct: any

    beforeAll(async () => {
        db = getTestDb()
    })

    afterAll(async () => {
        await closeTestDb()
    })

    beforeEach(async () => {
        await cleanTestData()
        await seedFreeTierProduct()

        // Create test user
        testUser = await createUser({
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            passwordHash: 'hashedpassword',
            age: 30
        })

        // Create test product
        const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
            name: 'Test Product',
            description: 'A test product for billing',
            priceInCents: 2999,
            externalProductId: 'prod_test123',
            externalPriceId: 'price_test123',
            active: true,
            isFreeTier: false,
            maxProjects: null
        }

        const dbData = keysToSnakeCase<typeof productData, Partial<ProductDbRow>>(productData)
        const [insertedRow] = await db('products').insert(dbData).returning('*')
        testProduct = insertedRow
    })

    describe('createBilling', () => {
        it('should create a new billing record', async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_test123',
                externalCustomerId: 'cus_test123',
                status: 'active',
                expiresAt: new Date('2024-12-31')
            }

            const result = await createBilling(billingData)

            expect(result).toBeDefined()
            expect(result.id).toBeDefined()
            expect(result.userId).toBe(billingData.userId)
            expect(result.productId).toBe(billingData.productId)
            expect(result.externalSubscriptionId).toBe(billingData.externalSubscriptionId)
            expect(result.externalCustomerId).toBe(billingData.externalCustomerId)
            expect(result.status).toBe(billingData.status)
            expect(new Date(result.expiresAt).getTime()).toBe(billingData.expiresAt.getTime())
            expect(result.createdAt).toBeDefined()
            expect(result.updatedAt).toBeDefined()
        })
    })

    describe('getBillingByUserId', () => {
        it('should retrieve billing by user ID', async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_test456',
                externalCustomerId: 'cus_test456',
                status: 'active',
                expiresAt: new Date('2024-12-31')
            }

            const createdBilling = await createBilling(billingData)
            const result = await getBillingByUserId({ userId: testUser.id })

            expect(result).toBeDefined()
            expect(result!.id).toBe(createdBilling.id)
            expect(result!.userId).toBe(testUser.id)
            expect(result!.externalSubscriptionId).toBe(billingData.externalSubscriptionId)
        })

        it('should return null for non-existent user billing', async () => {
            // Use a valid UUID format for the test
            const result = await getBillingByUserId({ userId: '00000000-0000-0000-0000-000000000000' })
            expect(result).toBeNull()
        })
    })

    describe('updateBillingByUserId', () => {
        it('should update billing expiration date', async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_test789',
                externalCustomerId: 'cus_test789',
                status: 'active',
                expiresAt: new Date('2024-06-30')
            }

            const createdBilling = await createBilling(billingData)
            const newExpirationDate = new Date('2024-12-31')

            const result = await updateBillingByUserId({
                id: createdBilling.id,
                expiresAt: newExpirationDate
            })

            expect(result).toBeDefined()
            expect(result.id).toBe(createdBilling.id)
            expect(new Date(result.expiresAt).getTime()).toBe(newExpirationDate.getTime())
            expect(new Date(result.updatedAt!!).getTime()).toBeGreaterThan(new Date(createdBilling.updatedAt!!).getTime())
        })
    })

    describe('getBillingByExternalSubscriptionId', () => {
        it('should retrieve billing by external subscription ID', async () => {
            const externalSubscriptionId = 'sub_external_123'
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId,
                externalCustomerId: 'cus_external_123',
                status: 'active',
                expiresAt: new Date('2024-12-31')
            }

            const createdBilling = await createBilling(billingData)
            const result = await getBillingByExternalSubscriptionId({ externalSubscriptionId })

            expect(result).toBeDefined()
            expect(result!.id).toBe(createdBilling.id)
            expect(result!.externalSubscriptionId).toBe(externalSubscriptionId)
        })

        it('should return null for non-existent external subscription ID', async () => {
            const result = await getBillingByExternalSubscriptionId({
                externalSubscriptionId: 'non-existent-sub-id'
            })
            expect(result).toBeNull()
        })
    })

    describe('updateBillingById', () => {
        let testBilling: Billing

        beforeEach(async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_update_test',
                externalCustomerId: 'cus_update_test',
                status: 'active',
                expiresAt: new Date('2024-06-30')
            }

            testBilling = await createBilling(billingData)
        })

        it('should update billing status only', async () => {
            const result = await updateBillingById({
                id: testBilling.id,
                status: 'past_due'
            })

            expect(result).toBeDefined()
            expect(result.id).toBe(testBilling.id)
            expect(result.status).toBe('past_due')
            expect(new Date(result.expiresAt).getTime()).toBe(new Date(testBilling.expiresAt).getTime())
            expect(new Date(result.updatedAt!).getTime()).toBeGreaterThan(new Date(testBilling.updatedAt!).getTime())
        })

        it('should update billing expiration date only', async () => {
            const newExpirationDate = new Date('2025-01-31')

            const result = await updateBillingById({
                id: testBilling.id,
                expiresAt: newExpirationDate
            })

            expect(result).toBeDefined()
            expect(result.id).toBe(testBilling.id)
            expect(result.status).toBe(testBilling.status)
            expect(new Date(result.expiresAt).getTime()).toBe(newExpirationDate.getTime())
            expect(new Date(result.updatedAt!).getTime()).toBeGreaterThan(new Date(testBilling.updatedAt!).getTime())
        })

        it('should update both status and expiration date', async () => {
            const newExpirationDate = new Date('2025-02-28')

            const result = await updateBillingById({
                id: testBilling.id,
                status: 'canceled',
                expiresAt: newExpirationDate
            })

            expect(result).toBeDefined()
            expect(result.id).toBe(testBilling.id)
            expect(result.status).toBe('canceled')
            expect(new Date(result.expiresAt).getTime()).toBe(newExpirationDate.getTime())
            expect(new Date(result.updatedAt!).getTime()).toBeGreaterThan(new Date(testBilling.updatedAt!).getTime())
        })

        it('should update only updatedAt when no status or expiration provided', async () => {
            const result = await updateBillingById({
                id: testBilling.id
            })

            expect(result).toBeDefined()
            expect(result.id).toBe(testBilling.id)
            expect(result.status).toBe(testBilling.status)
            expect(new Date(result.expiresAt).getTime()).toBe(new Date(testBilling.expiresAt).getTime())
            expect(new Date(result.updatedAt!).getTime()).toBeGreaterThan(new Date(testBilling.updatedAt!).getTime())
        })
    })
})