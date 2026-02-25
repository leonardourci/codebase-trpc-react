import { getTestDb, cleanTestData, closeTestDb } from '../../setup/test-db'
import { getProductById, getProductByExternalProductId, getAllProducts, getFreeTierProduct } from '../../../src/database/repositories/product.repository'
import { Product, ProductDbRow } from '../../../src/types/product'
import { keysToSnakeCase } from '../../../src/utils/case-conversion'

describe('Product Repository', () => {
    let db: any

    beforeAll(async () => {
        db = getTestDb()
    })

    afterAll(async () => {
        await closeTestDb()
    })

    beforeEach(async () => {
        await cleanTestData()
    })

    describe('getProductById', () => {
        it('should retrieve product by ID', async () => {
            const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Test Product',
                description: 'A test product',
                priceInCents: 1999,
                externalProductId: 'prod_test123',
                externalPriceId: 'price_test123',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const dbData = keysToSnakeCase<typeof productData, Partial<ProductDbRow>>(productData)
            const [insertedRow] = await db('products').insert(dbData).returning('*')

            const result = await getProductById({ id: insertedRow.id })

            expect(result).toBeDefined()
            expect(result!.id).toBe(insertedRow.id)
            expect(result!.name).toBe(productData.name)
            expect(result!.description).toBe(productData.description)
            expect(result!.priceInCents).toBe(productData.priceInCents)
            expect(result!.externalProductId).toBe(productData.externalProductId)
            expect(result!.externalPriceId).toBe(productData.externalPriceId)
            expect(result!.active).toBe(productData.active)
        })

        it('should return null for non-existent product ID', async () => {
            // Use a valid UUID format for the test
            const result = await getProductById({ id: '00000000-0000-0000-0000-000000000000' })
            expect(result).toBeNull()
        })
    })

    describe('getProductByExternalProductId', () => {
        it('should retrieve product by external product ID', async () => {
            const productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'External Test Product',
                description: 'A test product with external ID',
                priceInCents: 2999,
                externalProductId: 'prod_external_456',
                externalPriceId: 'price_external_456',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const dbData = keysToSnakeCase<typeof productData, Partial<ProductDbRow>>(productData)
            const [insertedRow] = await db('products').insert(dbData).returning('*')

            const result = await getProductByExternalProductId({ id: productData.externalProductId! })

            expect(result).toBeDefined()
            expect(result!.id).toBe(insertedRow.id)
            expect(result!.name).toBe(productData.name)
            expect(result!.externalProductId).toBe(productData.externalProductId)
        })

        it('should return null for non-existent external product ID', async () => {
            const result = await getProductByExternalProductId({ id: 'non-existent-external-id' })
            expect(result).toBeNull()
        })
    })

    describe('getAllProducts', () => {
        it('should return empty array when no products exist', async () => {
            const result = await getAllProducts()
            expect(result).toEqual([])
        })

        it('should return all active products', async () => {
            const activeProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Active Product',
                description: 'An active product',
                priceInCents: 1500,
                externalProductId: 'prod_active_123',
                externalPriceId: 'price_active_123',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const inactiveProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Inactive Product',
                description: 'An inactive product',
                priceInCents: 2500,
                externalProductId: 'prod_inactive_123',
                externalPriceId: 'price_inactive_123',
                active: false,
                isFreeTier: false,
                maxProjects: null
            }

            const activeDbData = keysToSnakeCase<typeof activeProduct, Partial<ProductDbRow>>(activeProduct)
            const inactiveDbData = keysToSnakeCase<typeof inactiveProduct, Partial<ProductDbRow>>(inactiveProduct)

            await db('products').insert([activeDbData, inactiveDbData])

            const result = await getAllProducts()

            expect(result).toHaveLength(1)
            expect(result[0]!.name).toBe(activeProduct.name)
            expect(result[0]!.active).toBe(true)
        })

        it('should return multiple active products', async () => {
            const product1: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Product 1',
                description: 'First product',
                priceInCents: 1000,
                externalProductId: 'prod_1',
                externalPriceId: 'price_1',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const product2: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Product 2',
                description: 'Second product',
                priceInCents: 2000,
                externalProductId: 'prod_2',
                externalPriceId: 'price_2',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const dbData1 = keysToSnakeCase<typeof product1, Partial<ProductDbRow>>(product1)
            const dbData2 = keysToSnakeCase<typeof product2, Partial<ProductDbRow>>(product2)

            await db('products').insert([dbData1, dbData2])

            const result = await getAllProducts()

            expect(result).toHaveLength(2)
            expect(result.map(p => p.name)).toContain(product1.name)
            expect(result.map(p => p.name)).toContain(product2.name)
            expect(result.every(p => p.active)).toBe(true)
        })
    })

    describe('getFreeTierProduct', () => {
        it('should retrieve the free tier product', async () => {
            const freeTierProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Free Tier',
                description: 'Free tier with basic features',
                priceInCents: 0,
                externalProductId: null,
                externalPriceId: null,
                active: true,
                isFreeTier: true,
                maxProjects: 5
            }

            const paidProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Paid Product',
                description: 'A paid product',
                priceInCents: 2999,
                externalProductId: 'prod_paid_123',
                externalPriceId: 'price_paid_123',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const freeTierDbData = keysToSnakeCase<typeof freeTierProduct, Partial<ProductDbRow>>(freeTierProduct)
            const paidDbData = keysToSnakeCase<typeof paidProduct, Partial<ProductDbRow>>(paidProduct)

            await db('products').insert([freeTierDbData, paidDbData])

            const result = await getFreeTierProduct()

            expect(result).toBeDefined()
            expect(result.name).toBe(freeTierProduct.name)
            expect(result.isFreeTier).toBe(true)
            expect(result.priceInCents).toBe(0)
            expect(result.maxProjects).toBe(5)
        })

        it('should throw error when no free tier product exists', async () => {
            const paidProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name: 'Paid Product',
                description: 'A paid product',
                priceInCents: 2999,
                externalProductId: 'prod_paid_123',
                externalPriceId: 'price_paid_123',
                active: true,
                isFreeTier: false,
                maxProjects: null
            }

            const paidDbData = keysToSnakeCase<typeof paidProduct, Partial<ProductDbRow>>(paidProduct)
            await db('products').insert(paidDbData)

            await expect(getFreeTierProduct()).rejects.toThrow(
                'Free tier product not found. Update your database seed to mark one product with is_free_tier = true.'
            )
        })
    })
})