import { createTestClient, createAuthenticatedTestClient } from '../../setup/test-client'
import { startTestServer, stopTestServer } from '../../setup/test-server'
import { cleanTestData, closeTestDb, getTestDb, seedFreeTierProduct } from '../../setup/test-db'
import type { SignupInput, LoginInput } from '../../../src/types/auth'
import jwt from 'jsonwebtoken'
import globalConfig from '../../../src/utils/global-config'

describe('Authentication Integration Tests', () => {
    let baseUrl: string
    let testClient: ReturnType<typeof createTestClient>

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
    })

    describe('User Registration', () => {
        it('should successfully register a new user with valid data', async () => {
            const signupData: SignupInput = {
                fullName: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                password: 'securePassword123',
                age: 25
            }

            const response = await testClient.auth.signup.mutate(signupData)

            expect(response).toBeDefined()
            expect(response.id).toBeDefined()
            expect(response.fullName).toBe(signupData.fullName)
            expect(response.email).toBe(signupData.email)
            expect(response.phone).toBe(signupData.phone)
            expect(response.age).toBe(signupData.age)
            expect(response).not.toHaveProperty('password')
        })

        it('should reject registration with invalid email format', async () => {
            const signupData: SignupInput = {
                fullName: 'John Doe',
                email: 'invalid-email',
                phone: '+1234567890',
                password: 'securePassword123',
                age: 25
            }

            await expect(testClient.auth.signup.mutate(signupData))
                .rejects.toThrow()
        })

        it('should reject registration with missing required fields', async () => {
            const signupData = {
                email: 'john.doe@example.com',
                password: 'securePassword123'
                // Missing fullName, phone, age
            } as SignupInput

            await expect(testClient.auth.signup.mutate(signupData))
                .rejects.toThrow()
        })

        it('should reject registration with duplicate email', async () => {
            const signupData: SignupInput = {
                fullName: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                password: 'securePassword123',
                age: 25
            }

            await testClient.auth.signup.mutate(signupData)

            await expect(testClient.auth.signup.mutate(signupData))
                .rejects.toThrow()
        })
    })

    describe('User Login', () => {
        let registeredUser: SignupInput

        beforeEach(async () => {
            registeredUser = {
                fullName: 'Jane Smith',
                email: 'jane.smith@example.com',
                phone: '+1987654321',
                password: 'mySecurePassword456',
                age: 30
            }
            await testClient.auth.signup.mutate(registeredUser)
        })

        it('should successfully login with valid credentials', async () => {
            const loginData: LoginInput = {
                email: registeredUser.email,
                password: registeredUser.password
            }

            const response = await testClient.auth.login.mutate(loginData)

            expect(response).toBeDefined()
            expect(response.accessToken).toBeDefined()
            expect(response.refreshToken).toBeDefined()
            expect(typeof response.accessToken).toBe('string')
            expect(typeof response.refreshToken).toBe('string')
            expect(response.accessToken.length).toBeGreaterThan(0)
            expect(response.refreshToken.length).toBeGreaterThan(0)
        })

        it('should reject login with invalid email', async () => {
            const loginData: LoginInput = {
                email: 'nonexistent@example.com',
                password: registeredUser.password
            }

            await expect(testClient.auth.login.mutate(loginData))
                .rejects.toThrow()
        })

        it('should reject login with invalid password', async () => {
            const loginData: LoginInput = {
                email: registeredUser.email,
                password: 'wrongPassword'
            }

            await expect(testClient.auth.login.mutate(loginData))
                .rejects.toThrow()
        })

        it('should reject login with malformed email', async () => {
            const loginData: LoginInput = {
                email: 'invalid-email-format',
                password: registeredUser.password
            }

            await expect(testClient.auth.login.mutate(loginData))
                .rejects.toThrow()
        })
    })

    describe('JWT Token Validation and Protected Endpoints', () => {
        let validToken: string
        let registeredUser: SignupInput

        beforeEach(async () => {
            registeredUser = {
                fullName: 'Alice Johnson',
                email: 'alice.johnson@example.com',
                phone: '+1555123456',
                password: 'aliceSecurePass789',
                age: 28
            }

            await testClient.auth.signup.mutate(registeredUser)

            const loginResponse = await testClient.auth.login.mutate({
                email: registeredUser.email,
                password: registeredUser.password
            })

            validToken = loginResponse.accessToken
        })

        it('should allow access to protected endpoints with valid JWT token', async () => {
            const authenticatedClient = createAuthenticatedTestClient(baseUrl, validToken)

            const response = await authenticatedClient.auth.logout.mutate()

            expect(response).toBeDefined()
            expect(response.success).toBe(true)
        })

        it('should reject access to protected endpoints without token', async () => {
            const unauthenticatedClient = createTestClient(baseUrl)

            await expect(unauthenticatedClient.auth.logout.mutate())
                .rejects.toThrow()
        })

        it('should reject access to protected endpoints with invalid token', async () => {
            const invalidToken = 'invalid.jwt.token'
            const authenticatedClient = createAuthenticatedTestClient(baseUrl, invalidToken)

            await expect(authenticatedClient.auth.logout.mutate())
                .rejects.toThrow()
        })

        it('should reject access to protected endpoints with malformed token', async () => {
            const malformedToken = 'not-a-jwt-token-at-all'
            const authenticatedClient = createAuthenticatedTestClient(baseUrl, malformedToken)

            await expect(authenticatedClient.auth.logout.mutate())
                .rejects.toThrow()
        })

        it('should validate JWT token structure and content', async () => {
            const loginResponse = await testClient.auth.login.mutate({
                email: registeredUser.email,
                password: registeredUser.password
            })

            const token = loginResponse.accessToken
            expect(() => jwt.verify(token, globalConfig.jwtSecret)).not.toThrow()

            const authenticatedClient = createAuthenticatedTestClient(baseUrl, token)
            const logoutResponse = await authenticatedClient.auth.logout.mutate()
            expect(logoutResponse.success).toBe(true)
        })
    })

    describe('Authentication Flow Integration', () => {
        it('should complete full registration -> login -> protected access flow', async () => {
            const userData: SignupInput = {
                fullName: 'Bob Wilson',
                email: 'bob.wilson@example.com',
                phone: '+1444555666',
                password: 'bobSecurePassword123',
                age: 35
            }

            // Act 1: Register
            const signupResponse = await testClient.auth.signup.mutate(userData)
            expect(signupResponse.id).toBeDefined()
            expect(signupResponse.email).toBe(userData.email)

            // Act 2: Login
            const loginResponse = await testClient.auth.login.mutate({
                email: userData.email,
                password: userData.password
            })
            expect(loginResponse.accessToken).toBeDefined()
            expect(loginResponse.refreshToken).toBeDefined()

            // Act 3: Access protected endpoint
            const authenticatedClient = createAuthenticatedTestClient(baseUrl, loginResponse.accessToken)
            const logoutResponse = await authenticatedClient.auth.logout.mutate()

            // Assert
            expect(logoutResponse.success).toBe(true)
        })
    })
})