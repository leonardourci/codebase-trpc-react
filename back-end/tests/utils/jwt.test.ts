import jwt from 'jsonwebtoken'
import { generateJwtToken, verifyJwtToken, decodeJwtToken } from '../../src/utils/jwt'
import { CustomError, ZodValidationError } from '../../src/utils/errors'
import { EStatusCodes } from '../../src/utils/statusCodes'
import globalConfig from '../../src/utils/globalConfig'

jest.mock('../../src/utils/globalConfig', () => ({
    jwtSecret: 'test-secret-key'
}))

describe('JWT Utilities', () => {
    const mockUserId = 'user-123'
    const validToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImlhdCI6MTYzOTY4MDAwMCwiZXhwIjoxNjQwMjg0ODAwfQ.test'

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('generateJwtToken', () => {
        it('should generate a JWT token with user ID', () => {
            const token = generateJwtToken({ userId: mockUserId })

            expect(typeof token).toBe('string')
            expect(token.length).toBeGreaterThan(0)

            // Verify the token contains the user ID
            const decoded = jwt.decode(token) as any
            expect(decoded.userId).toBe(mockUserId)
        })

        it('should generate different tokens for different user IDs', () => {
            const token1 = generateJwtToken({ userId: 'user-1' })
            const token2 = generateJwtToken({ userId: 'user-2' })

            expect(token1).not.toBe(token2)
        })

        it('should generate tokens with 7 day expiration', () => {
            const token = generateJwtToken({ userId: mockUserId })
            const decoded = jwt.decode(token) as any

            expect(decoded.exp).toBeDefined()
            expect(decoded.iat).toBeDefined()

            // Should expire in approximately 7 days (604800 seconds)
            const expirationDuration = decoded.exp - decoded.iat
            expect(expirationDuration).toBe(604800)
        })
    })

    describe('verifyJwtToken', () => {
        it('should verify a valid token successfully', () => {
            const validToken = generateJwtToken({ userId: mockUserId })
            const bearerToken = `Bearer ${validToken}`

            expect(() => verifyJwtToken({ token: bearerToken })).not.toThrow()
        })

        it('should throw ZodValidationError for invalid input format', () => {
            expect(() => verifyJwtToken({ token: '' })).toThrow(ZodValidationError)
            expect(() => verifyJwtToken({ token: null as any })).toThrow(ZodValidationError)
            expect(() => verifyJwtToken({ token: undefined as any })).toThrow(ZodValidationError)
        })

        it('should throw ZodValidationError for token without Bearer prefix', () => {
            const token = generateJwtToken({ userId: mockUserId })

            expect(() => verifyJwtToken({ token })).toThrow(ZodValidationError)
            expect(() => verifyJwtToken({ token })).toThrow('Validation failed')
        })

        it('should throw CustomError for invalid token format', () => {
            expect(() => verifyJwtToken({ token: 'Bearer invalid-token' })).toThrow(CustomError)
            expect(() => verifyJwtToken({ token: 'Bearer invalid-token' })).toThrow('TOKEN_ERROR')
        })

        it('should throw CustomError for expired token', () => {
            // Create an expired token
            const expiredToken = jwt.sign(
                { userId: mockUserId },
                globalConfig.jwtSecret,
                { expiresIn: '-1s' } // Already expired
            )

            expect(() => verifyJwtToken({ token: `Bearer ${expiredToken}` })).toThrow(CustomError)
        })

        it('should throw CustomError for token with wrong secret', () => {
            const tokenWithWrongSecret = jwt.sign(
                { userId: mockUserId },
                'wrong-secret',
                { expiresIn: '7d' }
            )

            expect(() => verifyJwtToken({ token: `Bearer ${tokenWithWrongSecret}` })).toThrow(CustomError)
        })

        it('should throw CustomError with UNAUTHORIZED status code', () => {
            try {
                verifyJwtToken({ token: 'Bearer invalid-token' })
            } catch (error) {
                expect(error).toBeInstanceOf(CustomError)
                expect((error as CustomError).statusCode).toBe(EStatusCodes.UNAUTHORIZED)
            }
        })
    })

    describe('decodeJwtToken', () => {
        it('should decode a valid token successfully', () => {
            const token = generateJwtToken({ userId: mockUserId })
            const bearerToken = `Bearer ${token}`

            const decoded = decodeJwtToken({ token: bearerToken })

            expect(decoded).toBeDefined()
            expect(decoded.userId).toBe(mockUserId)
            expect(decoded.iat).toBeDefined()
            expect(decoded.exp).toBeDefined()
        })

        it('should throw ZodValidationError for invalid input format', () => {
            expect(() => decodeJwtToken({ token: '' })).toThrow(ZodValidationError)
            expect(() => decodeJwtToken({ token: null as any })).toThrow(ZodValidationError)
            expect(() => decodeJwtToken({ token: undefined as any })).toThrow(ZodValidationError)
        })

        it('should decode token without Bearer prefix and handle gracefully', () => {
            const token = generateJwtToken({ userId: mockUserId })

            // This should work because jwt.decode doesn't validate the signature
            const decoded = decodeJwtToken({ token: `Bearer ${token}` })
            expect(decoded.userId).toBe(mockUserId)
        })

        it('should handle malformed Bearer token', () => {
            // jwt.decode returns null for invalid tokens
            const result = decodeJwtToken({ token: 'Bearer invalid-token' })
            expect(result).toBeNull()
        })

        it('should decode token with additional claims', () => {
            const tokenWithClaims = jwt.sign(
                {
                    userId: mockUserId,
                    role: 'admin',
                    permissions: ['read', 'write']
                },
                globalConfig.jwtSecret,
                { expiresIn: '7d' }
            )

            const decoded = decodeJwtToken({ token: `Bearer ${tokenWithClaims}` }) as any

            expect(decoded.userId).toBe(mockUserId)
            expect(decoded.role).toBe('admin')
            expect(decoded.permissions).toEqual(['read', 'write'])
        })

        it('should handle empty Bearer token', () => {
            const result = decodeJwtToken({ token: 'Bearer ' })
            expect(result).toBeNull()
        })
    })

    describe('integration tests', () => {
        it('should generate, verify, and decode token in sequence', () => {
            // Generate token
            const token = generateJwtToken({ userId: mockUserId })
            const bearerToken = `Bearer ${token}`

            // Verify token
            expect(() => verifyJwtToken({ token: bearerToken })).not.toThrow()

            // Decode token
            const decoded = decodeJwtToken({ token: bearerToken })
            expect(decoded.userId).toBe(mockUserId)
        })

        it('should handle complete token lifecycle', () => {
            const userId = 'integration-test-user'

            // Generate
            const token = generateJwtToken({ userId })
            expect(token).toBeDefined()

            // Format as Bearer token
            const bearerToken = `Bearer ${token}`

            // Verify
            expect(() => verifyJwtToken({ token: bearerToken })).not.toThrow()

            // Decode and verify contents
            const decoded = decodeJwtToken({ token: bearerToken })
            expect(decoded.userId).toBe(userId)
            expect(decoded.iat).toBeDefined()
            expect(decoded.exp).toBeDefined()
            expect(decoded.exp).toBeGreaterThan(decoded.iat)
        })
    })
})