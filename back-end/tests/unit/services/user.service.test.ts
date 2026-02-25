const mockGetUserById = jest.fn()
const mockUpdateUserById = jest.fn()

jest.mock('../../../src/database/repositories/user.repository', () => ({
	getUserById: (...args: any[]) => mockGetUserById(...args),
	updateUserById: (...args: any[]) => mockUpdateUserById(...args)
}))

import { getUserProfile, updateUserProfile, removeUserSensitive } from '../../../src/services/user.service'

describe('User Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	const mockUser = {
		id: 'user-123',
		email: 'test@example.com',
		fullName: 'Test User',
		age: 25,
		phone: '1234567890',
		emailVerified: true,
		passwordHash: 'hashed-password',
		refreshToken: 'refresh-token',
		googleId: 'google-123',
		emailVerificationToken: null,
		currentProductId: null,
		createdAt: new Date(),
		updatedAt: new Date()
	}

	describe('removeUserSensitive', () => {
		it('should strip sensitive fields from user', () => {
			const profile = removeUserSensitive({ user: mockUser })

			expect(profile).toEqual({
				id: 'user-123',
				email: 'test@example.com',
				fullName: 'Test User',
				age: 25,
				phone: '1234567890',
				emailVerified: true
			})
			expect((profile as any).passwordHash).toBeUndefined()
			expect((profile as any).refreshToken).toBeUndefined()
			expect((profile as any).googleId).toBeUndefined()
		})
	})

	describe('getUserProfile', () => {
		it('should return user profile when user exists', async () => {
			mockGetUserById.mockResolvedValue(mockUser)

			const result = await getUserProfile({ userId: 'user-123' })

			expect(result).toEqual({
				id: 'user-123',
				email: 'test@example.com',
				fullName: 'Test User',
				age: 25,
				phone: '1234567890',
				emailVerified: true
			})
			expect(mockGetUserById).toHaveBeenCalledWith({ id: 'user-123' })
		})

		it('should return null when user does not exist', async () => {
			mockGetUserById.mockResolvedValue(null)

			const result = await getUserProfile({ userId: 'nonexistent' })

			expect(result).toBeNull()
		})
	})

	describe('updateUserProfile', () => {
		it('should update and return user profile', async () => {
			const updatedUser = { ...mockUser, fullName: 'Updated Name' }
			mockUpdateUserById.mockResolvedValue(updatedUser)

			const result = await updateUserProfile({
				userId: 'user-123',
				updates: { fullName: 'Updated Name' }
			})

			expect(result).toEqual({
				id: 'user-123',
				email: 'test@example.com',
				fullName: 'Updated Name',
				age: 25,
				phone: '1234567890',
				emailVerified: true
			})
			expect(mockUpdateUserById).toHaveBeenCalledWith({
				id: 'user-123',
				updates: { fullName: 'Updated Name' }
			})
		})

		it('should return null when user does not exist', async () => {
			mockUpdateUserById.mockResolvedValue(null)

			const result = await updateUserProfile({
				userId: 'nonexistent',
				updates: { fullName: 'Updated' }
			})

			expect(result).toBeNull()
		})
	})
})
