import * as trpcIndex from '../../src/trpc/index'

describe('tRPC Index Exports', () => {
	it('should export tRPC utilities', () => {
		expect(trpcIndex.router).toBeDefined()
		expect(trpcIndex.procedure).toBeDefined()
		expect(trpcIndex.middleware).toBeDefined()
		expect(trpcIndex.createTRPCContext).toBeDefined()
		expect(trpcIndex.t).toBeDefined()
	})

	it('should have correct router function', () => {
		expect(typeof trpcIndex.router).toBe('function')

		const testRouter = trpcIndex.router({
			test: trpcIndex.procedure.query(() => 'test')
		})

		expect(testRouter).toBeDefined()
		expect(testRouter._def).toBeDefined()
		expect(testRouter._def.record.test).toBeDefined()
	})

	it('should have correct procedure function', () => {
		expect(typeof trpcIndex.procedure).toBe('object')
		expect(trpcIndex.procedure.query).toBeDefined()
		expect(trpcIndex.procedure.mutation).toBeDefined()
		expect(typeof trpcIndex.procedure.query).toBe('function')
		expect(typeof trpcIndex.procedure.mutation).toBe('function')
	})

	it('should have correct middleware function', () => {
		expect(typeof trpcIndex.middleware).toBe('function')

		const testMiddleware = trpcIndex.middleware(async ({ next }) => {
			return next()
		})

		expect(testMiddleware).toBeDefined()
		expect(typeof testMiddleware).toBe('object')
	})

	it('should have correct createTRPCContext function', () => {
		expect(typeof trpcIndex.createTRPCContext).toBe('function')

		const mockReq = {}
		const mockRes = {}

		const context = trpcIndex.createTRPCContext({ req: mockReq, res: mockRes })

		expect(context).toBeDefined()
		expect(context.req).toBe(mockReq)
		expect(context.res).toBe(mockRes)
	})

	it('should have correct t instance', () => {
		expect(trpcIndex.t).toBeDefined()
		expect(trpcIndex.t.router).toBeDefined()
		expect(trpcIndex.t.procedure).toBeDefined()
		expect(trpcIndex.t.middleware).toBeDefined()
	})
})
