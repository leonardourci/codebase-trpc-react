import { getTestDb, closeTestDb, cleanTestData, seedFreeTierProduct } from '../../setup/test-db'
import { createUser, getUserById, getUserByEmail, updateUserById } from '../../../src/database/repositories/user.repository'
import { getProductById, getAllProducts } from '../../../src/database/repositories/product.repository'
import { createBilling, getBillingByUserId, updateBillingById } from '../../../src/database/repositories/billing.repository'
import type { CreateUserInput, User } from '../../../src/types/user'
import type { Product } from '../../../src/types/product'
import type { CreateBilling, Billing } from '../../../src/types/billing'
import { Knex } from 'knex'

describe('Database Integration Tests', () => {
    let db: Knex

    beforeAll(async () => {
        db = getTestDb()
        await db.migrate.latest()
    })

    afterAll(async () => {
        await closeTestDb()
    })

    beforeEach(async () => {
        await cleanTestData()
        await seedFreeTierProduct()
    })

    describe('Database Connection and Migration', () => {
        it('should successfully connect to test database', async () => {
            const result = await db.raw('SELECT 1 as test')
            expect(result.rows[0].test).toBe(1)
        })

        it('should have all required tables after migration', async () => {
            const tables = await db.raw(`
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public'
                ORDER BY tablename
            `)

            const tableNames = tables.rows.map((row: any) => row.tablename)
            expect(tableNames).toContain('users')
            expect(tableNames).toContain('products')
            expect(tableNames).toContain('billings')
            expect(tableNames).toContain('knex_migrations')
        })

        it('should have correct table structure for users', async () => {
            const columns = await db.raw(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY column_name
            `)

            const columnNames = columns.rows.map((row: any) => row.column_name)
            expect(columnNames).toContain('id')
            expect(columnNames).toContain('email')
            expect(columnNames).toContain('full_name')
            expect(columnNames).toContain('phone')
            expect(columnNames).toContain('age')
            expect(columnNames).toContain('password_hash')
            expect(columnNames).toContain('refresh_token')
            expect(columnNames).toContain('created_at')
            expect(columnNames).toContain('updated_at')
        })

        it('should have correct table structure for products', async () => {
            const columns = await db.raw(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'products'
                ORDER BY column_name
            `)

            const columnNames = columns.rows.map((row: any) => row.column_name)
            expect(columnNames).toContain('id')
            expect(columnNames).toContain('name')
            expect(columnNames).toContain('description')
            expect(columnNames).toContain('price_in_cents')
            expect(columnNames).toContain('external_product_id')
            expect(columnNames).toContain('external_price_id')
            expect(columnNames).toContain('active')
        })

        it('should have correct table structure for billings', async () => {
            const columns = await db.raw(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'billings'
                ORDER BY column_name
            `)

            const columnNames = columns.rows.map((row: any) => row.column_name)
            expect(columnNames).toContain('id')
            expect(columnNames).toContain('user_id')
            expect(columnNames).toContain('product_id')
            expect(columnNames).toContain('external_subscription_id')
            expect(columnNames).toContain('external_customer_id')
            expect(columnNames).toContain('status')
            expect(columnNames).toContain('expires_at')
        })
    })

    describe('User Model CRUD Operations', () => {
        const testUserData: CreateUserInput = {
            fullName: 'Test User',
            email: 'test@example.com',
            passwordHash: 'hashedPassword123',
            age: 25,
            phone: '+1234567890'
        }

        it('should create a new user successfully', async () => {
            const user = await createUser(testUserData)

            expect(user).toBeDefined()
            expect(user.id).toBeDefined()
            expect(user.email).toBe(testUserData.email)
            expect(user.fullName).toBe(testUserData.fullName)
            expect(user.age).toBe(testUserData.age)
            expect(user.phone).toBe(testUserData.phone)
        })

        it('should retrieve user by ID', async () => {
            const createdUser = await createUser(testUserData)
            const retrievedUser = await getUserById({ id: createdUser.id })

            expect(retrievedUser).toBeDefined()
            expect(retrievedUser!.id).toBe(createdUser.id)
            expect(retrievedUser!.email).toBe(testUserData.email)
            expect(retrievedUser!.fullName).toBe(testUserData.fullName)
        })

        it('should retrieve user by email', async () => {
            const createdUser = await createUser(testUserData)
            const retrievedUser = await getUserByEmail({ email: testUserData.email })

            expect(retrievedUser).toBeDefined()
            expect(retrievedUser!.id).toBe(createdUser.id)
            expect(retrievedUser!.passwordHash).toBe(testUserData.passwordHash)
        })

        it('should update user information', async () => {
            const createdUser = await createUser(testUserData)
            const updates = {
                fullName: 'Updated Name',
                age: 30
            }

            await updateUserById({ id: createdUser.id, updates })
            const updatedUser = await getUserById({ id: createdUser.id })

            expect(updatedUser!.fullName).toBe(updates.fullName)
            expect(updatedUser!.age).toBe(updates.age)
            expect(updatedUser!.email).toBe(testUserData.email) // Should remain unchanged
        })

        it('should return null for non-existent user ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000'
            const user = await getUserById({ id: nonExistentId })

            expect(user).toBeNull()
        })

        it('should return null for non-existent email', async () => {
            const user = await getUserByEmail({ email: 'nonexistent@example.com' })

            expect(user).toBeNull()
        })
    })

    describe('Product Model CRUD Operations', () => {
        let testProduct: Product

        beforeEach(async () => {
            // Insert test product directly into database
            const [productRow] = await db('products').insert({
                name: 'Test Product',
                description: 'A test product for integration testing',
                price_in_cents: 1999,
                external_product_id: 'prod_test123',
                external_price_id: 'price_test123',
                active: true,
                is_free_tier: false,
                max_projects: null
            }).returning('*')

            testProduct = {
                id: productRow.id,
                name: productRow.name,
                description: productRow.description,
                priceInCents: productRow.price_in_cents,
                externalProductId: productRow.external_product_id,
                externalPriceId: productRow.external_price_id,
                active: productRow.active,
                isFreeTier: productRow.is_free_tier,
                maxProjects: productRow.max_projects,
                createdAt: productRow.created_at,
                updatedAt: productRow.updated_at
            }
        })

        it('should retrieve product by ID', async () => {
            const retrievedProduct = await getProductById({ id: testProduct.id })

            expect(retrievedProduct).toBeDefined()
            expect(retrievedProduct!.id).toBe(testProduct.id)
            expect(retrievedProduct!.name).toBe(testProduct.name)
            expect(retrievedProduct!.priceInCents).toBe(testProduct.priceInCents)
            expect(retrievedProduct!.active).toBe(true)
        })

        it('should retrieve all active products', async () => {
            // Insert another active product
            await db('products').insert({
                name: 'Another Product',
                description: 'Another test product',
                price_in_cents: 2999,
                external_product_id: 'prod_test456',
                external_price_id: 'price_test456',
                active: true
            })

            // Insert an inactive product
            await db('products').insert({
                name: 'Inactive Product',
                description: 'An inactive product',
                price_in_cents: 999,
                external_product_id: 'prod_inactive',
                external_price_id: 'price_inactive',
                active: false
            })

            const products = await getAllProducts()

            expect(products).toHaveLength(3) // Only active products (includes free tier product from seed)
            expect(products.every(p => p.active)).toBe(true)
        })

        it('should return null for non-existent product ID', async () => {
            const nonExistentId = '00000000-0000-0000-0000-000000000000'
            const product = await getProductById({ id: nonExistentId })

            expect(product).toBeNull()
        })
    })

    describe('Billing Model CRUD Operations', () => {
        let testUser: User
        let testProduct: Product

        beforeEach(async () => {
            const createdUser = await createUser({
                fullName: 'Billing Test User',
                email: 'billing@example.com',
                passwordHash: 'hashedPassword123',
                age: 30,
                phone: '+1987654321'
            })
            testUser = await getUserById({ id: createdUser.id }) as User

            const [productRow] = await db('products').insert({
                name: 'Billing Test Product',
                description: 'Product for billing tests',
                price_in_cents: 2999,
                external_product_id: 'prod_billing123',
                external_price_id: 'price_billing123',
                active: true,
                is_free_tier: false,
                max_projects: null
            }).returning('*')

            testProduct = {
                id: productRow.id,
                name: productRow.name,
                description: productRow.description,
                priceInCents: productRow.price_in_cents,
                externalProductId: productRow.external_product_id,
                externalPriceId: productRow.external_price_id,
                active: productRow.active,
                isFreeTier: productRow.is_free_tier,
                maxProjects: productRow.max_projects,
                createdAt: productRow.created_at,
                updatedAt: productRow.updated_at
            }
        })

        it('should create a new billing record', async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_test123',
                externalCustomerId: 'cus_test123',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }

            const billing = await createBilling(billingData)

            expect(billing).toBeDefined()
            expect(billing.id).toBeDefined()
            expect(billing.userId).toBe(testUser.id)
            expect(billing.productId).toBe(testProduct.id)
            expect(billing.status).toBe('active')
        })

        it('should retrieve billing by user ID', async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_test456',
                externalCustomerId: 'cus_test456',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }

            const createdBilling = await createBilling(billingData)
            const retrievedBilling = await getBillingByUserId({ userId: testUser.id })

            expect(retrievedBilling).toBeDefined()
            expect(retrievedBilling!.id).toBe(createdBilling.id)
            expect(retrievedBilling!.userId).toBe(testUser.id)
        })

        it('should update billing record', async () => {
            const billingData: CreateBilling = {
                userId: testUser.id,
                productId: testProduct.id,
                externalSubscriptionId: 'sub_test789',
                externalCustomerId: 'cus_test789',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }

            const createdBilling = await createBilling(billingData)
            const newExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now

            const updatedBilling = await updateBillingById({
                id: createdBilling.id,
                status: 'cancelled',
                expiresAt: newExpiresAt
            })

            expect(updatedBilling.status).toBe('cancelled')
            expect(updatedBilling.expiresAt.getTime()).toBe(newExpiresAt.getTime())
        })

        it('should return null for non-existent user billing', async () => {
            const nonExistentUserId = '00000000-0000-0000-0000-000000000000'
            const billing = await getBillingByUserId({ userId: nonExistentUserId })

            expect(billing).toBeNull()
        })
    })

    describe('Database Constraint Enforcement', () => {
        it('should enforce unique email constraint on users table', async () => {
            const userData: CreateUserInput = {
                fullName: 'Constraint Test User',
                email: 'constraint@example.com',
                passwordHash: 'hashedPassword123',
                age: 25,
                phone: '+1234567890'
            }

            await createUser(userData)

            // Attempt to create another user with the same email
            await expect(createUser(userData)).rejects.toThrow()
        })

        it('should enforce foreign key constraint on billings table (user_id)', async () => {
            const nonExistentUserId = '00000000-0000-0000-0000-000000000000'

            // Create a test product first
            const [productRow] = await db('products').insert({
                name: 'FK Test Product',
                description: 'Product for FK test',
                price_in_cents: 1999,
                external_product_id: 'prod_fk123',
                external_price_id: 'price_fk123',
                active: true
            }).returning('*')

            const billingData: CreateBilling = {
                userId: nonExistentUserId,
                productId: productRow.id,
                externalSubscriptionId: 'sub_fk123',
                externalCustomerId: 'cus_fk123',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }

            await expect(createBilling(billingData)).rejects.toThrow()
        })

        it('should enforce foreign key constraint on billings table (product_id)', async () => {
            const user = await createUser({
                fullName: 'FK Test User',
                email: 'fktest@example.com',
                passwordHash: 'hashedPassword123',
                age: 25,
                phone: '+1234567890'
            })

            const nonExistentProductId = '00000000-0000-0000-0000-000000000000'

            const billingData: CreateBilling = {
                userId: user.id,
                productId: nonExistentProductId,
                externalSubscriptionId: 'sub_fk456',
                externalCustomerId: 'cus_fk456',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }

            await expect(createBilling(billingData)).rejects.toThrow()
        })

        it('should enforce NOT NULL constraints on required fields', async () => {
            // Test users table NOT NULL constraint
            await expect(
                db('users').insert({
                    email: 'notnull@example.com',
                    // Missing required fields: full_name, phone, age, password_hash
                })
            ).rejects.toThrow()

            // Test products table NOT NULL constraint
            await expect(
                db('products').insert({
                    name: 'Incomplete Product',
                    // Missing required fields: description, price_in_cents, etc.
                })
            ).rejects.toThrow()
        })

        it('should cascade delete billings when user is deleted', async () => {
            const user = await createUser({
                fullName: 'Cascade Test User',
                email: 'cascade@example.com',
                passwordHash: 'hashedPassword123',
                age: 25,
                phone: '+1234567890'
            })

            const [productRow] = await db('products').insert({
                name: 'Cascade Test Product',
                description: 'Product for cascade test',
                price_in_cents: 1999,
                external_product_id: 'prod_cascade123',
                external_price_id: 'price_cascade123',
                active: true
            }).returning('*')

            const billingData: CreateBilling = {
                userId: user.id,
                productId: productRow.id,
                externalSubscriptionId: 'sub_cascade123',
                externalCustomerId: 'cus_cascade123',
                status: 'active',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }

            const billing = await createBilling(billingData)

            const existingBilling = await getBillingByUserId({ userId: user.id })
            expect(existingBilling).toBeDefined()

            await db('users').where({ id: user.id }).del()

            // Verify billing was cascade deleted
            const deletedBilling = await getBillingByUserId({ userId: user.id })
            expect(deletedBilling).toBeNull()
        })
    })
})