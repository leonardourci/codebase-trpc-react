import { createTestClient } from '../setup/test-client'
import { startTestServer, stopTestServer } from '../setup/test-server'
import { cleanTestData, closeTestDb, getTestDb } from '../setup/test-db'
import { type IProduct, type IProductDbRow } from '../../src/types/product'
import { keysToCamelCase, keysToSnakeCase } from '../../src/utils/case-conversion'

const PRODUCTS_TABLE = 'products'

describe('Product Integration Tests', () => {
    let baseUrl: string
    let testClient: ReturnType<typeof createTestClient>
    let testDb: ReturnType<typeof getTestDb>

    beforeAll(async () => {
        testDb = getTestDb()
        await testDb.migrate.latest()

        baseUrl = await startTestServer()
        testClient = createTestClient(baseUrl)
    })

    afterAll(async () => {
        await stopTestServer()
        await closeTestDb()
    })

    beforeEach(async () => {
        await cleanTestData()
    })

    const createTestProduct = async (overrides: Partial<IProduct> = {}): Promise<IProduct> => {
        const productData: Omit<IProduct, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<IProduct, 'id' | 'createdAt' | 'updatedAt'>> = {
            name: 'Test Product',
            description: 'A test product for integration testing',
            priceInCents: 2999,
            currency: 'USD',
            type: 'subscription',
            externalProductId: 'prod_test123',
            externalPriceId: 'price_test123',
            active: true,
            ...overrides
        }

        const dbData = keysToSnakeCase<typeof productData, Partial<IProductDbRow>>(productData)
        const [insertedRow] = await testDb(PRODUCTS_TABLE)
            .insert(dbData)
            .returning('*')

        return keysToCamelCase<IProductDbRow, IProduct>(insertedRow)
    }

    describe('Product Retrieval by ID', () => {
        it('should successfully retrieve a product by valid ID', async () => {
            const testProduct = await createTestProduct({
                name: 'Premium Plan',
                description: 'Premium subscription plan',
                priceInCents: 4999
            })

            const response = await testClient.product.getById.query({ id: testProduct.id })

            expect(response).toBeDefined()
            expect(response!.id).toBe(testProduct.id)
            expect(response!.name).toBe('Premium Plan')
            expect(response!.description).toBe('Premium subscription plan')
            expect(response!.priceInCents).toBe(4999)
            expect(response!.currency).toBe('USD')
            expect(response!.type).toBe('subscription')
            expect(response!.active).toBe(true)
        })

        it('should return null for non-existent product ID', async () => {
            const nonExistentId = '550e8400-e29b-41d4-a716-446655440000'

            const response = await testClient.product.getById.query({ id: nonExistentId })

            expect(response).toBeNull()
        })

        it('should reject request with empty product ID', async () => {
            await expect(testClient.product.getById.query({ id: '' }))
                .rejects.toThrow()
        })

        it('should reject request with invalid UUID format', async () => {
            await expect(testClient.product.getById.query({ id: 'invalid-uuid' }))
                .rejects.toThrow()
        })

        it('should retrieve product with all required fields populated', async () => {
            const testProduct = await createTestProduct({
                name: 'Basic Plan',
                description: 'Basic subscription with limited features',
                priceInCents: 1999,
                currency: 'EUR',
                type: 'one-time',
                externalProductId: 'prod_basic_eur',
                externalPriceId: 'price_basic_eur'
            })

            const response = await testClient.product.getById.query({ id: testProduct.id })

            expect(response).toBeDefined()
            expect(response!.name).toBe('Basic Plan')
            expect(response!.description).toBe('Basic subscription with limited features')
            expect(response!.priceInCents).toBe(1999)
            expect(response!.currency).toBe('EUR')
            expect(response!.type).toBe('one-time')
            expect(response!.externalProductId).toBe('prod_basic_eur')
            expect(response!.externalPriceId).toBe('price_basic_eur')
            expect(response!.active).toBe(true)
            expect(response!.createdAt).toBeDefined()
            expect(response!.updatedAt).toBeDefined()
        })
    })

    describe('Get All Products', () => {
        it('should return empty array when no products exist', async () => {
            const response = await testClient.product.getAll.query()

            expect(response).toBeDefined()
            expect(Array.isArray(response)).toBe(true)
            expect(response).toHaveLength(0)
        })

        it('should return all active products', async () => {
            await createTestProduct({
                name: 'Product 1',
                description: 'First test product',
                active: true
            })

            await createTestProduct({
                name: 'Product 2',
                description: 'Second test product',
                active: true
            })

            const response = await testClient.product.getAll.query()

            expect(response).toBeDefined()
            expect(Array.isArray(response)).toBe(true)
            expect(response).toHaveLength(2)
            expect(response[0]?.name).toBe('Product 1')
            expect(response[1]?.name).toBe('Product 2')
        })

        it('should exclude inactive products from results', async () => {
            await createTestProduct({
                name: 'Active Product',
                description: 'This product is active',
                active: true
            })

            await createTestProduct({
                name: 'Inactive Product',
                description: 'This product is inactive',
                active: false
            })

            const response = await testClient.product.getAll.query()

            expect(response).toBeDefined()
            expect(Array.isArray(response)).toBe(true)
            expect(response).toHaveLength(1)
            expect(response[0]?.name).toBe('Active Product')
            expect(response[0]?.active).toBe(true)
        })

        it('should return products with all required fields', async () => {
            await createTestProduct({
                name: 'Complete Product',
                description: 'Product with all fields',
                priceInCents: 3999,
                currency: 'GBP',
                type: 'recurring'
            })

            const response = await testClient.product.getAll.query()

            expect(response).toHaveLength(1)
            const product = response[0]
            expect(product).toBeDefined()
            expect(product!.id).toBeDefined()
            expect(product!.name).toBe('Complete Product')
            expect(product!.description).toBe('Product with all fields')
            expect(product!.priceInCents).toBe(3999)
            expect(product!.currency).toBe('GBP')
            expect(product!.type).toBe('recurring')
            expect(product!.externalProductId).toBeDefined()
            expect(product!.externalPriceId).toBeDefined()
            expect(product!.active).toBe(true)
            expect(product!.createdAt).toBeDefined()
            expect(product!.updatedAt).toBeDefined()
        })

        it('should handle multiple products with different currencies and types', async () => {
            await createTestProduct({
                name: 'USD Subscription',
                currency: 'USD',
                type: 'subscription',
                priceInCents: 2999
            })

            await createTestProduct({
                name: 'EUR One-time',
                currency: 'EUR',
                type: 'one-time',
                priceInCents: 4999
            })

            await createTestProduct({
                name: 'GBP Recurring',
                currency: 'GBP',
                type: 'recurring',
                priceInCents: 1999
            })

            const response = await testClient.product.getAll.query()

            expect(response).toHaveLength(3)

            const usdProduct = response.find(p => p.currency === 'USD')
            const eurProduct = response.find(p => p.currency === 'EUR')
            const gbpProduct = response.find(p => p.currency === 'GBP')

            expect(usdProduct).toBeDefined()
            expect(usdProduct!.type).toBe('subscription')
            expect(usdProduct!.priceInCents).toBe(2999)

            expect(eurProduct).toBeDefined()
            expect(eurProduct!.type).toBe('one-time')
            expect(eurProduct!.priceInCents).toBe(4999)

            expect(gbpProduct).toBeDefined()
            expect(gbpProduct!.type).toBe('recurring')
            expect(gbpProduct!.priceInCents).toBe(1999)
        })
    })

    describe('Product Data Validation', () => {
        it('should handle products with minimum valid data', async () => {
            const minimalProduct = await createTestProduct({
                name: 'Minimal Product',
                description: 'Minimal description',
                priceInCents: 1,
                currency: 'USD',
                type: 'one-time',
                externalProductId: 'min_prod',
                externalPriceId: 'min_price'
            })

            const response = await testClient.product.getById.query({ id: minimalProduct.id })

            expect(response).toBeDefined()
            expect(response!.name).toBe('Minimal Product')
            expect(response!.description).toBe('Minimal description')
            expect(response!.priceInCents).toBe(1)
        })

        it('should handle products with maximum length strings', async () => {
            const longName = 'A'.repeat(255)
            const longDescription = 'B'.repeat(1000)

            const maximalProduct = await createTestProduct({
                name: longName,
                description: longDescription,
                priceInCents: 999999999,
                currency: 'USD',
                type: 'subscription'
            })

            const response = await testClient.product.getById.query({ id: maximalProduct.id })

            expect(response).toBeDefined()
            expect(response!.name).toBe(longName)
            expect(response!.description).toBe(longDescription)
            expect(response!.priceInCents).toBe(999999999)
        })

        it('should handle products with special characters in text fields', async () => {
            const specialProduct = await createTestProduct({
                name: 'Product with émojis 🚀 & symbols!',
                description: 'Description with "quotes", <tags>, and unicode: ñáéíóú',
                currency: 'USD',
                type: 'subscription'
            })

            const response = await testClient.product.getById.query({ id: specialProduct.id })

            expect(response).toBeDefined()
            expect(response!.name).toBe('Product with émojis 🚀 & symbols!')
            expect(response!.description).toBe('Description with "quotes", <tags>, and unicode: ñáéíóú')
        })

        it('should handle zero price products', async () => {
            const freeProduct = await createTestProduct({
                name: 'Free Product',
                description: 'A free product',
                priceInCents: 0,
                currency: 'USD',
                type: 'free'
            })

            const response = await testClient.product.getById.query({ id: freeProduct.id })

            expect(response).toBeDefined()
            expect(response!.priceInCents).toBe(0)
            expect(response!.type).toBe('free')
        })

        it('should maintain data consistency between database and API response', async () => {
            const testProduct = await createTestProduct({
                name: 'Consistency Test',
                description: 'Testing data consistency',
                priceInCents: 5999,
                currency: 'CAD',
                type: 'monthly'
            })

            const apiResponse = await testClient.product.getById.query({ id: testProduct.id })

            const [dbProduct] = await testDb('products')
                .where({ id: testProduct.id })
                .select('*')

            expect(apiResponse).toBeDefined()
            expect(apiResponse!.id).toBe(dbProduct.id)
            expect(apiResponse!.name).toBe(dbProduct.name)
            expect(apiResponse!.description).toBe(dbProduct.description)
            expect(apiResponse!.priceInCents).toBe(dbProduct.price_in_cents)
            expect(apiResponse!.currency).toBe(dbProduct.currency)
            expect(apiResponse!.type).toBe(dbProduct.type)
            expect(apiResponse!.externalProductId).toBe(dbProduct.external_product_id)
            expect(apiResponse!.externalPriceId).toBe(dbProduct.external_price_id)
            expect(apiResponse!.active).toBe(dbProduct.active)
        })
    })
})