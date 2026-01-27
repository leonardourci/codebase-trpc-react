import { ZodError } from 'zod'
import { CustomError, ZodValidationError } from '../../src/utils/errors'
import { EStatusCodes } from '../../src/utils/status-codes'

// Helper function to create mock ZodError
const createMockZodError = (issues: Partial<ZodError['issues'][0]>[]): ZodError => {
    const fullIssues: ZodError['issues'] = issues.map(issue => ({
        code: 'custom',
        path: [],
        message: 'Default message',
        ...issue
    } as ZodError['issues'][0]))

    return {
        issues: fullIssues,
        format: () => ({} as any),
        flatten: () => ({} as any),
        formErrors: [],
        fieldErrors: {},
        name: 'ZodError',
        message: 'Validation error',
        stack: '',
        cause: undefined,
        toString: () => 'ZodError',
        addIssue: () => { },
        addIssues: () => { },
        isEmpty: false
    } as unknown as ZodError
}

describe('Error Utilities', () => {
    describe('CustomError', () => {
        it('should create a custom error with message and status code', () => {
            const message = 'Test error message'
            const statusCode = EStatusCodes.NOT_FOUND

            const error = new CustomError(message, statusCode)

            expect(error).toBeInstanceOf(Error)
            expect(error).toBeInstanceOf(CustomError)
            expect(error.message).toBe(message)
            expect(error.statusCode).toBe(statusCode)
            expect(error.name).toBe('Error')
        })

        it('should create custom error with UNAUTHORIZED status', () => {
            const error = new CustomError('Access denied', EStatusCodes.UNAUTHORIZED)

            expect(error.message).toBe('Access denied')
            expect(error.statusCode).toBe(EStatusCodes.UNAUTHORIZED)
        })

        it('should create custom error with INTERNAL status', () => {
            const error = new CustomError('Internal server error', EStatusCodes.INTERNAL_SERVER_ERROR)

            expect(error.message).toBe('Internal server error')
            expect(error.statusCode).toBe(EStatusCodes.INTERNAL_SERVER_ERROR)
        })

        it('should create custom error with CONFLICT status', () => {
            const error = new CustomError('Resource already exists', EStatusCodes.CONFLICT)

            expect(error.message).toBe('Resource already exists')
            expect(error.statusCode).toBe(EStatusCodes.CONFLICT)
        })

        it('should create custom error with PRECONDITION_FAILED status', () => {
            const error = new CustomError('Precondition failed', EStatusCodes.PRECONDITION_FAILED)

            expect(error.message).toBe('Precondition failed')
            expect(error.statusCode).toBe(EStatusCodes.PRECONDITION_FAILED)
        })

        it('should create custom error with NOT_ACCEPTABLE status', () => {
            const error = new CustomError('Not acceptable', EStatusCodes.NOT_ACCEPTABLE)

            expect(error.message).toBe('Not acceptable')
            expect(error.statusCode).toBe(EStatusCodes.NOT_ACCEPTABLE)
        })

        it('should create custom error with empty message', () => {
            const error = new CustomError('', EStatusCodes.BAD_REQUEST)

            expect(error.message).toBe('')
            expect(error.statusCode).toBe(EStatusCodes.BAD_REQUEST)
        })

        it('should inherit from Error class', () => {
            const error = new CustomError('Test', EStatusCodes.INTERNAL_SERVER_ERROR)

            expect(error instanceof Error).toBe(true)
            expect(error instanceof CustomError).toBe(true)
        })

        it('should have correct stack trace', () => {
            const error = new CustomError('Test error', EStatusCodes.INTERNAL_SERVER_ERROR)

            expect(error.stack).toBeDefined()
            expect(error.stack).toContain('Test error')
        })
    })

    describe('ZodValidationError', () => {
        it('should create validation error from ZodError with single issue', () => {
            const mockZodError = createMockZodError([
                { message: 'Field is required', path: ['field'], code: 'invalid_type' }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error).toBeInstanceOf(Error)
            expect(error).toBeInstanceOf(CustomError)
            expect(error).toBeInstanceOf(ZodValidationError)
            expect(error.message).toBe('Validation failed')
            expect(error.statusCode).toBe(EStatusCodes.UNPROCESSABLE)
            expect(error.messages).toEqual(['field: Field is required'])
        })

        it('should create validation error from ZodError with multiple issues', () => {
            const mockZodError = createMockZodError([
                { message: 'Field is required', path: ['field1'], code: 'invalid_type' },
                { message: 'Must be a string', path: ['field2'], code: 'invalid_type' },
                { message: 'Must be at least 3 characters', path: ['field3'], code: 'too_small' }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error.message).toBe('Validation failed')
            expect(error.statusCode).toBe(EStatusCodes.UNPROCESSABLE)
            expect(error.messages).toEqual([
                'field1: Field is required',
                'field2: Must be a string',
                'field3: Must be at least 3 characters'
            ])
        })

        it('should create validation error with empty issues array', () => {
            const mockZodError = createMockZodError([])

            const error = new ZodValidationError(mockZodError)

            expect(error.message).toBe('Validation failed')
            expect(error.statusCode).toBe(EStatusCodes.UNPROCESSABLE)
            expect(error.messages).toEqual([])
        })

        it('should inherit from CustomError', () => {
            const mockZodError = createMockZodError([
                { message: 'Test', path: [], code: 'custom' }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error instanceof Error).toBe(true)
            expect(error instanceof CustomError).toBe(true)
            expect(error instanceof ZodValidationError).toBe(true)
        })

        it('should extract messages from complex ZodError issues', () => {
            const mockZodError = createMockZodError([
                {
                    message: 'Invalid email format',
                    path: ['user', 'email'],
                    code: 'invalid_type'
                },
                {
                    message: 'Password must be at least 8 characters',
                    path: ['user', 'password'],
                    code: 'too_small'
                }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error.messages).toEqual([
                'user,email: Invalid email format',
                'user,password: Password must be at least 8 characters'
            ])
        })

        it('should handle ZodError with nested path structures', () => {
            const mockZodError = createMockZodError([
                { message: 'Required field missing', path: ['data', 'user', 'profile', 'name'], code: 'invalid_type' }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error.messages).toEqual(['data,user,profile,name: Required field missing'])
        })

        it('should always use UNPROCESSABLE status code', () => {
            const mockZodError = createMockZodError([
                { message: 'Any validation error', path: [], code: 'custom' }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error.statusCode).toBe(EStatusCodes.UNPROCESSABLE)
        })

        it('should always use "Validation failed" message', () => {
            const mockZodError = createMockZodError([
                { message: 'Specific field error', path: ['field'], code: 'invalid_type' }
            ])

            const error = new ZodValidationError(mockZodError)

            expect(error.message).toBe('Validation failed')
        })
    })

    describe('Error inheritance and behavior', () => {
        it('should allow instanceof checks for all error types', () => {
            const customError = new CustomError('Test', EStatusCodes.BAD_REQUEST)
            const zodError = new ZodValidationError(createMockZodError([]))

            expect(customError instanceof Error).toBe(true)
            expect(customError instanceof CustomError).toBe(true)
            expect(customError instanceof ZodValidationError).toBe(false)

            expect(zodError instanceof Error).toBe(true)
            expect(zodError instanceof CustomError).toBe(true)
            expect(zodError instanceof ZodValidationError).toBe(true)
        })

        it('should be throwable and catchable', () => {
            expect(() => {
                throw new CustomError('Test error', EStatusCodes.INTERNAL_SERVER_ERROR)
            }).toThrow(CustomError)

            expect(() => {
                throw new ZodValidationError(createMockZodError([]))
            }).toThrow(ZodValidationError)
        })

        it('should preserve error properties when caught', () => {
            try {
                throw new CustomError('Test message', EStatusCodes.NOT_FOUND)
            } catch (error) {
                expect(error).toBeInstanceOf(CustomError)
                expect((error as CustomError).message).toBe('Test message')
                expect((error as CustomError).statusCode).toBe(EStatusCodes.NOT_FOUND)
            }
        })
    })
})