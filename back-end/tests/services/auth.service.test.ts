import bcrypt from 'bcrypt'
import { authenticateUser, registerUser, refreshAccessToken, revokeUserRefreshToken } from '../../src/services/auth.service'
import * as userRepository from '../../src/database/repositories/user.repository'
import * as jwt from '../../src/utils/jwt'
import { CustomError } from '../../src/utils/errors'
import { EStatusCodes } from '../../src/utils/status-codes'
import { TLoginInput, TSignupInput } from '../../src/types/auth'
import { TRefreshTokenInput } from '../../src/types/refreshToken'

jest.mock('bcrypt')
jest.mock('../../src/database/repositories/user.repository')
jest.mock('../../src/utils/jwt')

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>
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

            const mockToken = 'jwt-token-123'

            mockUserRepository.getUserByEmail.mockResolvedValue(mockUser as any)
            mockBcrypt.compareSync.mockReturnValue(true)
            mockJwt.generateJwtToken.mockReturnValue(mockToken)
            mockUserRepository.updateUserById.mockResolvedValue(undefined)

            const result = await authenticateUser(loginInput)

            expect(mockUserRepository.getUserByEmail).toHaveBeenCalledWith({ email: loginInput.email })
            expect(mockBcrypt.compareSync).toHaveBeenCalledWith(loginInput.password, mockUser.passwordHash)
            expect(mockJwt.generateJwtToken).toHaveBeenCalledWith({ userId: mockUser.id })
            expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
                id: mockUser.id,
                updates: { refreshToken: mockToken }
            })
            expect(result).toEqual({
                accessToken: mockToken,
                refreshToken: mockToken
            })
        })

        it('should throw error when user is not found', async () => {
            mockUserRepository.getUserByEmail.mockResolvedValue(null)

            await expect(authenticateUser(loginInput)).rejects.toThrow(
                new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)
            )

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

            mockUserRepository.getUserByEmail.mockResolvedValue(mockUser as any)
            mockBcrypt.compareSync.mockReturnValue(false)

            await expect(authenticateUser(loginInput)).rejects.toThrow(
                new CustomError('Email or password is wrong', EStatusCodes.UNAUTHORIZED)
            )

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
            const mockCreatedUser = {
                id: 'user-123',
                fullName: signupInput.fullName,
                email: signupInput.email,
                phone: signupInput.phone,
                age: signupInput.age,
            }

            mockBcrypt.hashSync.mockReturnValue(hashedPassword)
            mockUserRepository.createUser.mockResolvedValue(mockCreatedUser as any)

            const result = await registerUser(signupInput)

            expect(mockBcrypt.hashSync).toHaveBeenCalledWith(signupInput.password, 10)
            expect(mockUserRepository.createUser).toHaveBeenCalledWith({
                fullName: signupInput.fullName,
                email: signupInput.email,
                phone: signupInput.phone,
                age: signupInput.age,
                passwordHash: hashedPassword
            })
            expect(result).toEqual(mockCreatedUser)
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

            mockJwt.verifyJwtToken.mockReturnValue(undefined)
            mockUserRepository.getUserByRefreshToken.mockResolvedValue(mockUser as any)
            mockJwt.generateJwtToken.mockReturnValue(newAccessToken)
            mockUserRepository.updateUserById.mockResolvedValue(undefined)

            const result = await refreshAccessToken(refreshTokenInput)

            expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: refreshTokenInput.refreshToken })
            expect(mockUserRepository.getUserByRefreshToken).toHaveBeenCalledWith({ refreshToken: refreshTokenInput.refreshToken })
            expect(mockJwt.generateJwtToken).toHaveBeenCalledWith({ userId: mockUser.id })
            expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
                id: mockUser.id,
                updates: { refreshToken: newAccessToken }
            })
            expect(result).toEqual({
                accessToken: newAccessToken,
                refreshToken: newAccessToken
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

            await expect(refreshAccessToken(refreshTokenInput)).rejects.toThrow(
                new CustomError('Invalid refresh token', EStatusCodes.UNAUTHORIZED)
            )

            expect(mockJwt.verifyJwtToken).toHaveBeenCalledWith({ token: refreshTokenInput.refreshToken })
            expect(mockUserRepository.getUserByRefreshToken).toHaveBeenCalledWith({ refreshToken: refreshTokenInput.refreshToken })
            expect(mockJwt.generateJwtToken).not.toHaveBeenCalled()
        })
    })

    describe('revokeUserRefreshToken', () => {
        it('should successfully revoke user refresh token', async () => {
            const userId = 'user-123'

            mockUserRepository.updateUserById.mockResolvedValue(undefined)

            await revokeUserRefreshToken(userId)

            expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
                id: userId,
                updates: { refreshToken: undefined }
            })
        })

        it('should handle repository errors gracefully', async () => {
            const userId = 'user-123'
            const repositoryError = new Error('Database connection failed')

            mockUserRepository.updateUserById.mockRejectedValue(repositoryError)

            await expect(revokeUserRefreshToken(userId)).rejects.toThrow(repositoryError)

            expect(mockUserRepository.updateUserById).toHaveBeenCalledWith({
                id: userId,
                updates: { refreshToken: undefined }
            })
        })
    })
})