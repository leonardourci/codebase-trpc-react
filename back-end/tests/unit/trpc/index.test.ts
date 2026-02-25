import * as trpcIndex from '../../../src/trpc/index'

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

        // Test that router function can create a router
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

        // Test that middleware function can create middleware
        const testMiddleware = trpcIndex.middleware(async ({ next }) => {
            return next()
        })

        expect(testMiddleware).toBeDefined()
        expect(typeof testMiddleware).toBe('object')
    })

    it('should have correct createTRPCContext function', () => {
        expect(typeof trpcIndex.createTRPCContext).toBe('function')

        const mockReq = {} as any
        const mockRes = {} as any

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

    it('should maintain consistent exports with actual module', () => {
        const indexModule = require('../../../src/trpc/index')

        expect(trpcIndex.router).toBe(indexModule.router)
        expect(trpcIndex.procedure).toBe(indexModule.procedure)
        expect(trpcIndex.middleware).toBe(indexModule.middleware)
        expect(trpcIndex.createTRPCContext).toBe(indexModule.createTRPCContext)
        expect(trpcIndex.t).toBe(indexModule.t)
    })
})
