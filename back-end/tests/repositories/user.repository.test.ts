import {
	createUser,
	getUserByEmail,
	getUserById,
	getUserByGoogleId,
	getUserByRefreshToken,
	getUserByEmailVerificationToken,
	updateUserById
} from '../../src/database/repositories/user.repository'
import { cleanTestData, seedFreeTierProduct } from '../setup/test-db'
import bcrypt from 'bcrypt'

describe('User Repository', () => {
	const createTestUser = async (overrides: Record<string, any> = {}) => {
		const passwordHash = await bcrypt.hash('testpassword', 10)
		return createUser({
			email: 'test@example.com',
			fullName: 'Test User',
			age: 25,
			phone: '1234567890',
			passwordHash,
			...overrides
		})
	}

	beforeEach(async () => {
		await cleanTestData()
		await seedFreeTierProduct()
	})

	describe('createUser', () => {
		it('should create and retrieve a user', async () => {
			const createdUser = await createTestUser()

			expect(createdUser).toMatchObject({
				email: 'test@example.com',
				fullName: 'Test User',
				age: 25,
				phone: '1234567890'
			})
			expect(createdUser.id).toBeDefined()
		})
	})

	describe('getUserByEmail', () => {
		it('should retrieve user by email', async () => {
			const createdUser = await createTestUser()

			const user = await getUserByEmail({ email: 'test@example.com' })

			expect(user).not.toBeNull()
			expect(user?.id).toBe(createdUser.id)
			expect(user?.passwordHash).toBeDefined()
		})

		it('should return null for non-existent email', async () => {
			const user = await getUserByEmail({ email: 'nonexistent@example.com' })
			expect(user).toBeNull()
		})
	})

	describe('getUserById', () => {
		it('should retrieve user by ID', async () => {
			const createdUser = await createTestUser()

			const user = await getUserById({ id: createdUser.id })

			expect(user).not.toBeNull()
			expect(user?.email).toBe('test@example.com')
		})

		it('should return null for non-existent ID', async () => {
			const user = await getUserById({ id: '00000000-0000-0000-0000-000000000000' })
			expect(user).toBeNull()
		})
	})

	describe('getUserByGoogleId', () => {
		it('should retrieve user by Google ID', async () => {
			const createdUser = await createTestUser({ googleId: 'google-123' })

			const user = await getUserByGoogleId({ googleId: 'google-123' })

			expect(user).not.toBeNull()
			expect(user?.id).toBe(createdUser.id)
		})

		it('should return null for non-existent Google ID', async () => {
			const user = await getUserByGoogleId({ googleId: 'nonexistent' })
			expect(user).toBeNull()
		})
	})

	describe('getUserByRefreshToken', () => {
		it('should retrieve user by refresh token', async () => {
			const createdUser = await createTestUser()
			await updateUserById({ id: createdUser.id, updates: { refreshToken: 'test-refresh-token' } })

			const user = await getUserByRefreshToken({ refreshToken: 'test-refresh-token' })

			expect(user).not.toBeNull()
			expect(user?.id).toBe(createdUser.id)
		})

		it('should return null for non-existent refresh token', async () => {
			const user = await getUserByRefreshToken({ refreshToken: 'nonexistent-token' })
			expect(user).toBeNull()
		})
	})

	describe('getUserByEmailVerificationToken', () => {
		it('should retrieve user by email verification token', async () => {
			const createdUser = await createTestUser()
			await updateUserById({ id: createdUser.id, updates: { emailVerificationToken: 'verify-token-123' } })

			const user = await getUserByEmailVerificationToken({ token: 'verify-token-123' })

			expect(user).not.toBeNull()
			expect(user?.id).toBe(createdUser.id)
		})

		it('should return null for non-existent verification token', async () => {
			const user = await getUserByEmailVerificationToken({ token: 'nonexistent-token' })
			expect(user).toBeNull()
		})
	})

	describe('updateUserById', () => {
		it('should update user fields', async () => {
			const createdUser = await createTestUser()

			const updatedUser = await updateUserById({
				id: createdUser.id,
				updates: { fullName: 'Updated Name', age: 30 }
			})

			expect(updatedUser.fullName).toBe('Updated Name')
			expect(updatedUser.age).toBe(30)
			expect(updatedUser.updatedAt).toBeDefined()
		})

		it('should update email verification status', async () => {
			const createdUser = await createTestUser()

			const updatedUser = await updateUserById({
				id: createdUser.id,
				updates: { emailVerified: true }
			})

			expect(updatedUser.emailVerified).toBe(true)
		})
	})
})
