import { createTestClient, createAuthenticatedTestClient } from '../../setup/test-client'
import { startTestServer, stopTestServer } from '../../setup/test-server'
import { cleanTestData, closeTestDb, getTestDb, seedFreeTierProduct } from '../../setup/test-db'
import type { SignupInput } from '../../../src/types/auth'
import type { UserProfile, UpdateUserInput } from '../../../src/types/user'

describe('User Management Integration Tests', () => {
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

    describe('Get User Profile', () => {
        let authenticatedClient: ReturnType<typeof createAuthenticatedTestClient>
        let registeredUser: SignupInput

        beforeEach(async () => {
            registeredUser = {
                fullName: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1234567890',
                password: 'securePassword123',
                age: 25
            }

            await testClient.auth.signup.mutate(registeredUser)

            const loginResponse = await testClient.auth.login.mutate({
                email: registeredUser.email,
                password: registeredUser.password
            })

            authenticatedClient = createAuthenticatedTestClient(baseUrl, loginResponse.accessToken)
        })

        it('should successfully get user profile with valid authentication', async () => {
            const profile: UserProfile = await authenticatedClient.user.getUserById.query() as UserProfile

            expect(profile).toBeDefined()
            expect(profile.id).toBeDefined()
            expect(profile.fullName).toBe(registeredUser.fullName)
            expect(profile.email).toBe(registeredUser.email)
            expect(profile.phone).toBe(registeredUser.phone)
            expect(profile.age).toBe(registeredUser.age)
            expect(profile).not.toHaveProperty('passwordHash')
            expect(profile).not.toHaveProperty('refreshToken')
        })

        it('should reject profile access without authentication', async () => {
            const unauthenticatedClient = createTestClient(baseUrl)

            await expect(unauthenticatedClient.user.getUserById.query())
                .rejects.toThrow()
        })

        it('should reject profile access with invalid token', async () => {
            const invalidClient = createAuthenticatedTestClient(baseUrl, 'invalid.jwt.token')

            await expect(invalidClient.user.getUserById.query())
                .rejects.toThrow()
        })
    })

    describe('Update User Profile', () => {
        let authenticatedClient: ReturnType<typeof createAuthenticatedTestClient>
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

            const loginResponse = await testClient.auth.login.mutate({
                email: registeredUser.email,
                password: registeredUser.password
            })

            authenticatedClient = createAuthenticatedTestClient(baseUrl, loginResponse.accessToken)
        })

        it('should successfully update user full name', async () => {
            const updateData: UpdateUserInput = {
                fullName: 'Jane Doe Smith'
            }

            const updatedUser = await authenticatedClient.user.updateUserById.mutate(updateData)

            expect(updatedUser).toBeDefined()
            expect(updatedUser!.fullName).toBe(updateData.fullName)
            expect(updatedUser!.email).toBe(registeredUser.email) // Should remain unchanged
            expect(updatedUser!.phone).toBe(registeredUser.phone) // Should remain unchanged
            expect(updatedUser!.age).toBe(registeredUser.age) // Should remain unchanged
        })

        it('should successfully update user email', async () => {
            const updateData: UpdateUserInput = {
                email: 'jane.newemail@example.com'
            }

            const updatedUser = await authenticatedClient.user.updateUserById.mutate(updateData)

            expect(updatedUser).toBeDefined()
            expect(updatedUser!.email).toBe(updateData.email)
            expect(updatedUser!.fullName).toBe(registeredUser.fullName) // Should remain unchanged
        })

        it('should successfully update user phone', async () => {
            const updateData: UpdateUserInput = {
                phone: '+1555999888'
            }

            const updatedUser = await authenticatedClient.user.updateUserById.mutate(updateData)

            expect(updatedUser).toBeDefined()
            expect(updatedUser!.phone).toBe(updateData.phone)
            expect(updatedUser!.fullName).toBe(registeredUser.fullName) // Should remain unchanged
        })

        it('should successfully update user age', async () => {
            const updateData: UpdateUserInput = {
                age: 35
            }

            const updatedUser = await authenticatedClient.user.updateUserById.mutate(updateData)

            expect(updatedUser).toBeDefined()
            expect(updatedUser!.age).toBe(updateData.age)
            expect(updatedUser!.fullName).toBe(registeredUser.fullName) // Should remain unchanged
        })

        it('should successfully update multiple fields at once', async () => {
            const updateData: UpdateUserInput = {
                fullName: 'Jane Updated Smith',
                phone: '+1777888999',
                age: 32
            }

            const updatedUser = await authenticatedClient.user.updateUserById.mutate(updateData)

            expect(updatedUser).toBeDefined()
            expect(updatedUser!.fullName).toBe(updateData.fullName)
            expect(updatedUser!.phone).toBe(updateData.phone)
            expect(updatedUser!.age).toBe(updateData.age)
            expect(updatedUser!.email).toBe(registeredUser.email) // Should remain unchanged
        })

        it('should reject update with invalid email format', async () => {
            const updateData: UpdateUserInput = {
                email: 'invalid-email-format'
            }

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with invalid age (negative)', async () => {
            const updateData: UpdateUserInput = {
                age: -5
            }

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with invalid age (non-integer)', async () => {
            const updateData: UpdateUserInput = {
                age: 25.5
            }

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with empty full name', async () => {
            const updateData: UpdateUserInput = {
                fullName: ''
            }

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with short full name', async () => {
            const updateData: UpdateUserInput = {
                fullName: 'Jo'
            }

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with empty phone', async () => {
            const updateData: UpdateUserInput = {
                phone: ''
            }

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with no fields provided', async () => {
            const updateData: UpdateUserInput = {}

            await expect(authenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update without authentication', async () => {
            const unauthenticatedClient = createTestClient(baseUrl)
            const updateData: UpdateUserInput = {
                fullName: 'Should Not Work'
            }

            await expect(unauthenticatedClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })

        it('should reject update with invalid token', async () => {
            const invalidClient = createAuthenticatedTestClient(baseUrl, 'invalid.jwt.token')
            const updateData: UpdateUserInput = {
                fullName: 'Should Not Work'
            }

            await expect(invalidClient.user.updateUserById.mutate(updateData))
                .rejects.toThrow()
        })
    })

    describe('User Profile Management Flow', () => {
        it('should complete full registration -> login -> get profile -> update profile flow', async () => {
            const userData: SignupInput = {
                fullName: 'Alice Johnson',
                email: 'alice.johnson@example.com',
                phone: '+1555123456',
                password: 'aliceSecurePass789',
                age: 28
            }

            const signupResponse = await testClient.auth.signup.mutate(userData)
            expect(signupResponse.id).toBeDefined()
            expect(signupResponse.email).toBe(userData.email)

            const loginResponse = await testClient.auth.login.mutate({
                email: userData.email,
                password: userData.password
            })
            expect(loginResponse.accessToken).toBeDefined()

            const authenticatedClient = createAuthenticatedTestClient(baseUrl, loginResponse.accessToken)

            const profile = await authenticatedClient.user.getUserById.query() as UserProfile
            expect(profile.fullName).toBe(userData.fullName)
            expect(profile.email).toBe(userData.email)

            const updateData: UpdateUserInput = {
                fullName: 'Alice Updated Johnson',
                age: 29
            }

            const updatedProfile = await authenticatedClient.user.updateUserById.mutate(updateData)
            expect(updatedProfile!.fullName).toBe(updateData.fullName)
            expect(updatedProfile!.age).toBe(updateData.age)
            expect(updatedProfile!.email).toBe(userData.email) // Should remain unchanged

            const finalProfile = await authenticatedClient.user.getUserById.query() as UserProfile
            expect(finalProfile.fullName).toBe(updateData.fullName)
            expect(finalProfile.age).toBe(updateData.age)
            expect(finalProfile.email).toBe(userData.email)
        })
    })
})