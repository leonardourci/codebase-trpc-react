import bcrypt from 'bcrypt'
import {
	authenticateUser,
	authenticateWithGoogle,
	registerUser,
	refreshAccessToken,
	revokeUserRefreshToken,
	verifyUserEmail,
	resendVerificationEmail,
	forgotPassword,
	resetPassword
} from '../../src/services/auth.service'
import * as userRepository from '../../src/database/repositories/user.repository'
import * as productRepository from '../../src/database/repositories/product.repository'
import * as billingRepository from '../../src/database/repositories/billing.repository'
import * as userService from '../../src/services/user.service'
import * as jwt from '../../src/utils/jwt'
import { CustomError } from '../../src/utils/errors'
import { EStatusCodes } from '../../src/utils/status-codes'
import { TLoginInput, TSignupInput } from '../../src/types/auth'
import { TRefreshTokenInput } from '../../src/types/refreshToken'
import { ETokenPurpose } from '../../src/types/jwt'
import { IUser } from '../../src/types/user'

jest.mock('google-auth-library', () => {
	const instance = { verifyIdToken: jest.fn() }
	return { OAuth2Client: jest.fn(() => instance) }
})

import { OAuth2Client } from 'google-auth-library'

const mockGoogleClient = new (OAuth2Client as any)() as { verifyIdToken: jest.Mock }

jest.mock('bcrypt')
jest.mock('../../src/database/repositories/user.repository')
jest.mock('../../src/database/repositories/product.repository')
jest.mock('../../src/database/repositories/billing.repository')
jest.mock('../../src/services/user.service')
jest.mock('../../src/utils/jwt')

const mockSendVerificationEmail = jest.fn().mockResolvedValue(undefined)
const mockSendPasswordResetEmail = jest.fn().mockResolvedValue(undefined)
jest.mock('../../src/utils/email', () => ({
	sendVerificationEmail: (...args: any[]) => mockSendVerificationEmail(...args),
	sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args)
}))

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>
const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>
const mockBillingRepository = billingRepository as jest.Mocked<typeof billingRepository>
const mockUserService = userService as jest.Mocked<typeof userService>
const mockJwt = jwt as jest.Mocked<typeof jwt>

const originalEnv = process.env
beforeAll(() => {
	process.env = {
		...originalEnv,
		HASH_SALT: '10'
	}
})

afterAll(() => {
	process.env = originalEnv
})

const createMockUser = (overrides?: Partial<IUser>): IUser => ({
	id: 'user-123',
	email: 'test@example.com',
	fullName: 'Test User',
	phone: '+1234567890',
	age: 25,
	passwordHash: 'hashedPassword',
	refreshToken: null,
	googleId: null,
	emailVerified: true,
	emailVerificationToken: null,
	productId: null,
	createdAt: new Date(),
	updatedAt: null,
	...overrides
})

describe('Auth Service', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	describe('authenticateUser', () => {
		const loginInput: TLoginInput = {
			email: 'test@example.com',
			password: 'testPassword123'
		}

		it('should successfully authenticate user with valid credentials', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				passwordHash: 'hashedPassword',
				fullName: 'Test User'
			}

			const mockAccessToken = 'jwt-access-token-123'
			const mockRefreshToken = 'jwt-refresh-token-123'

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockBcrypt.compareSync.mockReturnValue(true)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockJwt.generateJwtToken.mockReturnValueOnce(mockAccessToken).mockReturnValueOnce(mockRefreshToken)
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser({ refreshToken: mockRefreshToken }))

			const result = await authenticateUser(loginInput)

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: loginInput.email })
			expect(mockBcrypt.compareSync).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash)
			expect(mockJwt.generateJwtToken).toHaveBeenCalledWith({ userId: mockUser.id }, { expiresIn: '1h' })
			expect(mockJwt.generateJwtToken).toHaveBeenCalledWith({ userId: mockUser.id }, { expiresIn: '7d' })
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: mockUser.id,
				updates: { refreshToken: mockRefreshToken }
			})
			expect(result).toEqual({
				accessToken: mockAccessToken,
				refreshToken: mockRefreshToken
			})
		})

		it('should throw error when user is not found', async () => {
			mockUserRepository.getUserByEmail.mockResolvedValue(null)

			await expect(authenticateUser(loginInput)).rejects.toThrow(new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED))

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: loginInput.email })
			expect(mockBcrypt.compareSync).not.toHaveBeenCalled()
		})

		it('should throw error when password is invalid', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				passwordHash: 'hashedPassword',
				fullName: 'Test User'
			}

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockBcrypt.compareSync.mockReturnValue(false)

			await expect(authenticateUser(loginInput)).rejects.toThrow(new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED))

			expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: loginInput.email })
			expect(mockBcrypt.compareSync).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash)
			expect(mockJwt.generateJwtToken).not.toHaveBeenCalled()
		})
	})

	describe('registerUser', () => {
		const signupInput: TSignupInput = {
			fullName: 'Test User',
			email: 'test@example.com',
			phone: '+1234567890',
			password: 'testPassword123',
			age: 30
		}

		it('should successfully register user', async () => {
			const hashedPassword = 'hashedPassword123'
			const mockFreeTierProduct = {
				id: 'free-tier-product-id',
				name: 'Free Tier'
			}
			const mockCreatedUser = {
				id: 'user-123',
				fullName: signupInput.fullName,
				email: signupInput.email,
				phone: signupInput.phone,
				age: signupInput.age
			}
			const mockProfile = {
				id: 'user-123',
				fullName: signupInput.fullName,
				email: signupInput.email,
				phone: signupInput.phone,
				age: signupInput.age
			}

			mockBcrypt.hashSync.mockReturnValue(hashedPassword)
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct)
			mockUserRepository.createUser.mockResolvedValue(mockCreatedUser)
			mockJwt.generateJwtToken.mockReturnValue('verification-token')
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser())
			mockUserService.getUserProfile.mockResolvedValue(mockProfile)

			const result = await registerUser(signupInput)

			expect(mockBcrypt.hashSync).toHaveBeenCalledWith(signupInput.password, 10)
			expect(mockProductRepository.getFreeTierProduct).toHaveBeenCalled()
			expect(mockUserRepository.createUser).toHaveBeenCalledWith({
				fullName: signupInput.fullName,
				email: signupInput.email,
				phone: signupInput.phone,
				age: signupInput.age,
				passwordHash: hashedPassword,
				emailVerified: false,
				productId: mockFreeTierProduct.id
			})
			expect(result).toEqual(mockProfile)
		})
	})

	describe('refreshAccessToken', () => {
		const refreshTokenInput: TRefreshTokenInput = {
			refreshToken: 'valid-refresh-token'
		}

		it('should successfully refresh access token', async () => {
			const mockUser = {
				id: 'user-123',
				email: 'test@example.com',
				refreshToken: 'valid-refresh-token'
			}

			const newAccessToken = 'new-access-token'
			const newRefreshToken = 'new-refresh-token'

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockUserRepository.getUserByRefreshToken.mockResolvedValue(mockUser)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockJwt.generateJwtToken.mockReturnValueOnce(newAccessToken).mockReturnValueOnce(newRefreshToken)
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser({ refreshToken: newRefreshToken }))

			const result = await refreshAccessToken(refreshTokenInput)

			expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: refreshTokenInput.refreshToken })
			expect(mockUserRepository.getUserByRefreshToken).toHaveBeenCalledWith({ refreshToken: refreshTokenInput.refreshToken })
			expect(mockJwt.generateJwtToken).toHaveBeenCalledWith({ userId: mockUser.id }, { expiresIn: '1h' })
			expect(mockJwt.generateJwtToken).toHaveBeenCalledWith({ userId: mockUser.id }, { expiresIn: '7d' })
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: mockUser.id,
				updates: { refreshToken: newRefreshToken }
			})
			expect(result).toEqual({
				accessToken: newAccessToken,
				refreshToken: newRefreshToken
			})
		})

		it('should throw error when refresh token is invalid', async () => {
			mockJwt.verifyJwtToken.mockImplementation(() => {
				throw new Error('Invalid token')
			})

			await expect(refreshAccessToken(refreshTokenInput)).rejects.toThrow('Invalid token')

			expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: refreshTokenInput.refreshToken })
			expect(mockUserRepository.getUserByRefreshToken).not.toHaveBeenCalled()
		})

		it('should throw error when user with refresh token is not found', async () => {
			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockUserRepository.getUserByRefreshToken.mockResolvedValue(null)

			await expect(refreshAccessToken(refreshTokenInput)).rejects.toThrow(new CustomError('Invalid refresh token', EStatusCodes.UNAUTHORIZED))

			expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: refreshTokenInput.refreshToken })
			expect(mockUserRepository.getUserByRefreshToken).toHaveBeenCalledWith({ refreshToken: refreshTokenInput.refreshToken })
			expect(mockJwt.generateJwtToken).not.toHaveBeenCalled()
		})
	})

	describe('revokeUserRefreshToken', () => {
		it('should successfully revoke user refresh token', async () => {
			const userId = 'user-123'

			mockUserRepository.updateUserById.mockResolvedValue(createMockUser({ refreshToken: null }))

			await revokeUserRefreshToken({ userId })

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: userId,
				updates: { refreshToken: undefined }
			})
		})

		it('should handle repository errors gracefully', async () => {
			const userId = 'user-123'
			const repositoryError = new Error('Database connection failed')

			mockUserRepository.updateUserById.mockRejectedValue(repositoryError)

			await expect(revokeUserRefreshToken({ userId })).rejects.toThrow(repositoryError)

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: userId,
				updates: { refreshToken: undefined }
			})
		})
	})

	describe('authenticateWithGoogle', () => {
		const mockPayload = {
			sub: 'google-123',
			email: 'google@example.com',
			name: 'Google User'
		}

		beforeEach(() => {
			mockGoogleClient.verifyIdToken.mockResolvedValue({
				getPayload: () => mockPayload
			})
		})

		it('should authenticate existing Google user', async () => {
			const mockUser = createMockUser({ id: 'user-123', googleId: 'google-123' })

			mockUserRepository.getUserByGoogleId.mockResolvedValue(mockUser)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockJwt.generateJwtToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser({ refreshToken: 'refresh-token' }))

			const result = await authenticateWithGoogle({ credential: 'google-credential' })

			expect(mockUserRepository.getUserByGoogleId).toHaveBeenCalledWith({ googleId: 'google-123' })
			expect(mockUserRepository.getUserByEmail).not.toHaveBeenCalled()
			expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
		})

		it('should link Google account to existing email user', async () => {
			const mockUser = createMockUser({ id: 'user-456', googleId: null })

			mockUserRepository.getUserByGoogleId.mockResolvedValue(null)
			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockUserRepository.updateUserById
				.mockResolvedValueOnce(createMockUser({ id: 'user-456', googleId: 'google-123' })) // link
				.mockResolvedValueOnce(createMockUser({ refreshToken: 'refresh-token' })) // save token
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockJwt.generateJwtToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')

			const result = await authenticateWithGoogle({ credential: 'google-credential' })

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: 'user-456',
				updates: { googleId: 'google-123', emailVerified: true }
			})
			expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
		})

		it('should create new user when no Google or email match', async () => {
			const mockFreeTierProduct = { id: 'free-product-id', name: 'Free Tier' }
			const mockNewUser = createMockUser({ id: 'new-user', googleId: 'google-123' })

			mockUserRepository.getUserByGoogleId.mockResolvedValue(null)
			mockUserRepository.getUserByEmail.mockResolvedValue(null)
			mockBcrypt.hashSync.mockReturnValue('hashed-random-password')
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct)
			mockUserRepository.createUser.mockResolvedValue(mockNewUser)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(null)
			mockJwt.generateJwtToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser({ refreshToken: 'refresh-token' }))

			const result = await authenticateWithGoogle({ credential: 'google-credential' })

			expect(mockUserRepository.createUser).toHaveBeenCalledWith(
				expect.objectContaining({
					email: 'google@example.com',
					fullName: 'Google User',
					googleId: 'google-123',
					emailVerified: true
				})
			)
			expect(result).toEqual({ accessToken: 'access-token', refreshToken: 'refresh-token' })
		})

		it('should throw on invalid Google credential', async () => {
			mockGoogleClient.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

			await expect(authenticateWithGoogle({ credential: 'bad-credential' })).rejects.toThrow(new CustomError('Invalid Google token', EStatusCodes.UNAUTHORIZED))
		})

		it('should throw when Google payload is missing fields', async () => {
			mockGoogleClient.verifyIdToken.mockResolvedValue({
				getPayload: () => ({ sub: 'google-123', email: null, name: null })
			})

			await expect(authenticateWithGoogle({ credential: 'google-credential' })).rejects.toThrow(
				new CustomError('Invalid Google token', EStatusCodes.UNAUTHORIZED)
			)
		})

		it('should downgrade expired subscription on Google auth', async () => {
			const mockUser = createMockUser({ id: 'user-123', googleId: 'google-123' })
			const mockFreeTierProduct = { id: 'free-product-id', name: 'Free Tier' }
			const expiredBilling = {
				id: 'billing-123',
				userId: 'user-123',
				expiresAt: new Date(Date.now() - 86400000) // expired yesterday
			}

			mockUserRepository.getUserByGoogleId.mockResolvedValue(mockUser)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(expiredBilling)
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct)
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser())
			mockJwt.generateJwtToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')

			await authenticateWithGoogle({ credential: 'google-credential' })

			expect(mockProductRepository.getFreeTierProduct).toHaveBeenCalled()
			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: 'user-123',
				updates: { productId: 'free-product-id' }
			})
		})
	})

	describe('authenticateUser - expired subscription', () => {
		it('should downgrade expired subscription on login', async () => {
			const mockUser = createMockUser({ id: 'user-123' })
			const mockFreeTierProduct = { id: 'free-product-id', name: 'Free Tier' }
			const expiredBilling = {
				id: 'billing-123',
				userId: 'user-123',
				expiresAt: new Date(Date.now() - 86400000)
			}

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockBcrypt.compareSync.mockReturnValue(true)
			mockBillingRepository.getBillingByUserId.mockResolvedValue(expiredBilling)
			mockProductRepository.getFreeTierProduct.mockResolvedValue(mockFreeTierProduct)
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser())
			mockJwt.generateJwtToken.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token')

			await authenticateUser({ email: 'test@example.com', password: 'testPassword123' })

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: 'user-123',
				updates: { productId: 'free-product-id' }
			})
		})
	})

	describe('verifyUserEmail', () => {
		it('should verify email with valid token', async () => {
			const mockUser = createMockUser({ emailVerified: false, emailVerificationToken: 'valid-token' })

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123', purpose: ETokenPurpose.EMAIL_VERIFICATION })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser({ emailVerified: true }))

			await verifyUserEmail({ token: 'valid-token' })

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: 'user-123',
				updates: { emailVerified: true, emailVerificationToken: undefined }
			})
		})

		it('should throw on wrong token purpose', async () => {
			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123', purpose: ETokenPurpose.PASSWORD_RESET })

			await expect(verifyUserEmail({ token: 'wrong-purpose-token' })).rejects.toThrow(new CustomError('Invalid verification token', EStatusCodes.BAD_REQUEST))
		})

		it('should throw when user not found', async () => {
			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'nonexistent', purpose: ETokenPurpose.EMAIL_VERIFICATION })
			mockUserRepository.getUserById.mockResolvedValue(null)

			await expect(verifyUserEmail({ token: 'valid-token' })).rejects.toThrow(new CustomError('Invalid verification token', EStatusCodes.BAD_REQUEST))
		})

		it('should throw when token does not match stored token', async () => {
			const mockUser = createMockUser({ emailVerificationToken: 'different-token' })

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123', purpose: ETokenPurpose.EMAIL_VERIFICATION })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)

			await expect(verifyUserEmail({ token: 'valid-token' })).rejects.toThrow(
				new CustomError('Invalid or expired verification token', EStatusCodes.BAD_REQUEST)
			)
		})

		it('should return early if email already verified', async () => {
			const mockUser = createMockUser({ emailVerified: true, emailVerificationToken: 'valid-token' })

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123', purpose: ETokenPurpose.EMAIL_VERIFICATION })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)

			await verifyUserEmail({ token: 'valid-token' })

			expect(mockUserRepository.updateUserById).not.toHaveBeenCalled()
		})
	})

	describe('resendVerificationEmail', () => {
		it('should resend verification email', async () => {
			const mockUser = createMockUser({ emailVerified: false })

			mockUserRepository.getUserById.mockResolvedValue(mockUser)
			mockJwt.generateJwtToken.mockReturnValue('new-verification-token')
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser())

			await resendVerificationEmail({ userId: 'user-123' })

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: 'user-123',
				updates: { emailVerificationToken: 'new-verification-token' }
			})
			expect(mockSendVerificationEmail).toHaveBeenCalledWith({
				to: mockUser.email,
				fullName: mockUser.fullName,
				verificationToken: 'new-verification-token'
			})
		})

		it('should throw when user not found', async () => {
			mockUserRepository.getUserById.mockResolvedValue(null)

			await expect(resendVerificationEmail({ userId: 'nonexistent' })).rejects.toThrow(new CustomError('User not found', EStatusCodes.NOT_FOUND))
		})

		it('should throw when email already verified', async () => {
			const mockUser = createMockUser({ emailVerified: true })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)

			await expect(resendVerificationEmail({ userId: 'user-123' })).rejects.toThrow(new CustomError('Email already verified', EStatusCodes.BAD_REQUEST))
		})
	})

	describe('forgotPassword', () => {
		it('should send password reset email for existing user', async () => {
			const mockUser = createMockUser()

			mockUserRepository.getUserByEmail.mockResolvedValue(mockUser)
			mockJwt.generateJwtToken.mockReturnValue('reset-token')

			await forgotPassword({ email: 'test@example.com' })

			expect(mockSendPasswordResetEmail).toHaveBeenCalledWith({
				to: mockUser.email,
				fullName: mockUser.fullName,
				resetToken: 'reset-token'
			})
		})

		it('should silently return when user not found', async () => {
			mockUserRepository.getUserByEmail.mockResolvedValue(null)

			await forgotPassword({ email: 'nonexistent@example.com' })

			expect(mockSendPasswordResetEmail).not.toHaveBeenCalled()
		})
	})

	describe('resetPassword', () => {
		it('should reset password with valid token', async () => {
			const mockUser = createMockUser()

			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123', purpose: ETokenPurpose.PASSWORD_RESET })
			mockUserRepository.getUserById.mockResolvedValue(mockUser)
			mockBcrypt.hashSync.mockReturnValue('new-hashed-password')
			mockUserRepository.updateUserById.mockResolvedValue(createMockUser())

			await resetPassword({ token: 'valid-reset-token', newPassword: 'newPassword123' })

			expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
				id: 'user-123',
				updates: { passwordHash: 'new-hashed-password', refreshToken: undefined }
			})
		})

		it('should throw on wrong token purpose', async () => {
			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'user-123', purpose: ETokenPurpose.EMAIL_VERIFICATION })

			await expect(resetPassword({ token: 'wrong-token', newPassword: 'newPassword123' })).rejects.toThrow(
				new CustomError('Invalid reset token', EStatusCodes.BAD_REQUEST)
			)
		})

		it('should throw when user not found', async () => {
			mockJwt.verifyJwtToken.mockReturnValue(undefined)
			mockJwt.decodeJwtToken.mockReturnValue({ userId: 'nonexistent', purpose: ETokenPurpose.PASSWORD_RESET })
			mockUserRepository.getUserById.mockResolvedValue(null)

			await expect(resetPassword({ token: 'valid-token', newPassword: 'newPassword123' })).rejects.toThrow(
				new CustomError('Invalid reset token', EStatusCodes.BAD_REQUEST)
			)
		})
	})
})
