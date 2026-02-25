import { Request, Response } from 'express'
import { createTRPCContext } from '../../../src/trpc/index'

describe('tRPC Utilities', () => {
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
			} as unknown as Request

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
			const { router } = require('../../../src/trpc/index')
			expect(typeof router).toBe('function')
		})

		it('should export procedure object', () => {
			const { procedure } = require('../../../src/trpc/index')
			expect(typeof procedure).toBe('object')
			expect(procedure.query).toBeDefined()
			expect(procedure.mutation).toBeDefined()
		})

		it('should export middleware function', () => {
			const { middleware } = require('../../../src/trpc/index')
			expect(typeof middleware).toBe('function')
		})

		it('should export t instance', () => {
			const { t } = require('../../../src/trpc/index')
			expect(t).toBeDefined()
			expect(t.router).toBeDefined()
			expect(t.procedure).toBeDefined()
			expect(t.middleware).toBeDefined()
		})

		it('should have error formatter configured', () => {
			const { t } = require('../../../src/trpc/index')
			expect(t._config.errorFormatter).toBeDefined()
		})

		it('should format errors with custom details', () => {
			const { t } = require('../../../src/trpc/index')

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
			const { t } = require('../../../src/trpc/index')

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
