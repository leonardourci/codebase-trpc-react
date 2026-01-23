import { TRPCError } from '@trpc/server'
import { Request, Response } from 'express'
import { transformErrorToTRPC, createTRPCContext } from '../../src/trpc/trpc'
import { CustomError, ZodValidationError } from '../../src/utils/errors'
import { EStatusCodes } from '../../src/utils/statusCodes'
import { ZodError } from 'zod'

describe('tRPC Utilities', () => {
    describe('transformErrorToTRPC', () => {
        it('should transform ZodValidationError to TRPCError', () => {
            const mockZodError = {
                issues: [
                    { message: 'Field is required', path: ['field'], code: 'invalid_type' }
                ]
            } as ZodError

            const zodError = new ZodValidationError(mockZodError)

            const result = transformErrorToTRPC(zodError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('UNPROCESSABLE_CONTENT')
            expect(result.message).toBe('Validation failed')
            expect(result.cause).toHaveProperty('messages', ['Field is required'])
            expect(result.cause).toHaveProperty('statusCode', EStatusCodes.UNPROCESSABLE)
        })

        it('should transform ZodValidationError with multiple issues', () => {
            const mockZodError = {
                issues: [
                    { message: 'Field is required', path: ['field1'], code: 'invalid_type' },
                    { message: 'Must be a string', path: ['field2'], code: 'invalid_type' }
                ]
            } as ZodError

            const zodError = new ZodValidationError(mockZodError)

            const result = transformErrorToTRPC(zodError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('UNPROCESSABLE_CONTENT')
            expect(result.message).toBe('Validation failed')
            expect(result.cause).toHaveProperty('messages', ['Field is required', 'Must be a string'])
            expect(result.cause).toHaveProperty('statusCode', EStatusCodes.UNPROCESSABLE)
        })

        it('should transform CustomError with UNAUTHORIZED status to TRPCError', () => {
            const customError = new CustomError('Access denied', EStatusCodes.UNAUTHORIZED)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('UNAUTHORIZED')
            expect(result.message).toBe('Access denied')
            expect(result.cause).toHaveProperty('statusCode', EStatusCodes.UNAUTHORIZED)
        })

        it('should transform CustomError with NOT_FOUND status to TRPCError', () => {
            const customError = new CustomError('Resource not found', EStatusCodes.NOT_FOUND)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('NOT_FOUND')
            expect(result.message).toBe('Resource not found')
            expect(result.cause).toHaveProperty('statusCode', EStatusCodes.NOT_FOUND)
        })

        it('should transform CustomError with CONFLICT status to TRPCError', () => {
            const customError = new CustomError('Resource already exists', EStatusCodes.CONFLICT)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('CONFLICT')
            expect(result.message).toBe('Resource already exists')
            expect(result.cause).toHaveProperty('statusCode', EStatusCodes.CONFLICT)
        })

        it('should transform CustomError with PRECONDITION_FAILED status to TRPCError', () => {
            const customError = new CustomError('Precondition failed', EStatusCodes.PRECONDITION_FAILED)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('PRECONDITION_FAILED')
            expect(result.message).toBe('Precondition failed')
        })

        it('should transform CustomError with NOT_ACCEPTABLE status to TRPCError', () => {
            const customError = new CustomError('Not acceptable', EStatusCodes.NOT_ACCEPTABLE)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('BAD_REQUEST')
            expect(result.message).toBe('Not acceptable')
        })

        it('should transform CustomError with INTERNAL status to TRPCError', () => {
            const customError = new CustomError('Internal server error', EStatusCodes.INTERNAL)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('Internal server error')
            expect(result.cause).toHaveProperty('statusCode', EStatusCodes.INTERNAL)
        })

        it('should transform CustomError with unknown status code to INTERNAL_SERVER_ERROR', () => {
            const customError = new CustomError('Unknown error', 999 as any)

            const result = transformErrorToTRPC(customError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('Unknown error')
        })

        it('should transform generic Error to TRPCError', () => {
            const genericError = new Error('Something went wrong')

            const result = transformErrorToTRPC(genericError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('Something went wrong')
        })

        it('should transform Error with empty message to TRPCError', () => {
            const genericError = new Error('')

            const result = transformErrorToTRPC(genericError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('')
        })

        it('should transform unknown error to TRPCError', () => {
            const unknownError = 'string error'

            const result = transformErrorToTRPC(unknownError)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('An unexpected error occurred')
        })

        it('should transform null error to TRPCError', () => {
            const result = transformErrorToTRPC(null)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('An unexpected error occurred')
        })

        it('should transform undefined error to TRPCError', () => {
            const result = transformErrorToTRPC(undefined)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('An unexpected error occurred')
        })

        it('should transform number error to TRPCError', () => {
            const result = transformErrorToTRPC(404)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('An unexpected error occurred')
        })

        it('should transform boolean error to TRPCError', () => {
            const result = transformErrorToTRPC(false)

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('An unexpected error occurred')
        })

        it('should transform object error to TRPCError', () => {
            const result = transformErrorToTRPC({ error: 'custom object' })

            expect(result).toBeInstanceOf(TRPCError)
            expect(result.code).toBe('INTERNAL_SERVER_ERROR')
            expect(result.message).toBe('An unexpected error occurred')
        })
    })

    describe('createTRPCContext', () => {
        it('should create tRPC context with request and response', () => {
            const mockReq = {
                headers: { authorization: 'Bearer token' },
                body: { test: 'data' }
            } as Request

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as unknown as Response

            const context = createTRPCContext({ req: mockReq, res: mockRes })

            expect(context).toEqual({
                req: mockReq,
                res: mockRes
            })
            expect(context.user).toBeUndefined()
        })

        it('should create context without user initially', () => {
            const mockReq = {} as Request
            const mockRes = {} as Response

            const context = createTRPCContext({ req: mockReq, res: mockRes })

            expect(context.req).toBe(mockReq)
            expect(context.res).toBe(mockRes)
            expect(context.user).toBeUndefined()
        })

        it('should create context with empty headers', () => {
            const mockReq = {
                headers: {}
            } as Request

            const mockRes = {
                status: jest.fn(),
                json: jest.fn()
            } as unknown as Response

            const context = createTRPCContext({ req: mockReq, res: mockRes })

            expect(context.req).toBe(mockReq)
            expect(context.res).toBe(mockRes)
            expect(context.user).toBeUndefined()
        })

        it('should create context with complex request object', () => {
            const mockReq = {
                headers: {
                    authorization: 'Bearer token',
                    'content-type': 'application/json',
                    'user-agent': 'test-agent'
                },
                body: {
                    data: 'test',
                    nested: { value: 123 }
                },
                params: { id: '123' },
                query: { filter: 'active' }
            } as Request

            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                send: jest.fn()
            } as unknown as Response

            const context = createTRPCContext({ req: mockReq, res: mockRes })

            expect(context.req).toBe(mockReq)
            expect(context.res).toBe(mockRes)
            expect(context.user).toBeUndefined()
            expect(context.req.headers.authorization).toBe('Bearer token')
            expect(context.req.body.data).toBe('test')
        })
    })

    describe('tRPC instance configuration', () => {
        it('should export router function', () => {
            const { router } = require('../../src/trpc/trpc')
            expect(typeof router).toBe('function')
        })

        it('should export procedure object', () => {
            const { procedure } = require('../../src/trpc/trpc')
            expect(typeof procedure).toBe('object')
            expect(procedure.query).toBeDefined()
            expect(procedure.mutation).toBeDefined()
        })

        it('should export middleware function', () => {
            const { middleware } = require('../../src/trpc/trpc')
            expect(typeof middleware).toBe('function')
        })

        it('should export t instance', () => {
            const { t } = require('../../src/trpc/trpc')
            expect(t).toBeDefined()
            expect(t.router).toBeDefined()
            expect(t.procedure).toBeDefined()
            expect(t.middleware).toBeDefined()
        })

        it('should have error formatter configured', () => {
            const { t } = require('../../src/trpc/trpc')
            expect(t._config.errorFormatter).toBeDefined()
        })

        it('should format errors with custom details', () => {
            const { t } = require('../../src/trpc/trpc')

            const mockShape = {
                data: { code: 'INTERNAL_SERVER_ERROR' },
                message: 'Test error'
            }

            const mockError = {
                cause: { customData: 'test' }
            }

            const formatted = t._config.errorFormatter({ shape: mockShape, error: mockError })

            expect(formatted.data.details).toEqual({ customData: 'test' })
        })

        it('should format errors without cause as undefined details', () => {
            const { t } = require('../../src/trpc/trpc')

            const mockShape = {
                data: { code: 'INTERNAL_SERVER_ERROR' },
                message: 'Test error'
            }

            const mockError = {}

            const formatted = t._config.errorFormatter({ shape: mockShape, error: mockError })

            expect(formatted.data.details).toBeUndefined()
        })
    })
})