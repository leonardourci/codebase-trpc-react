import * as trpcIndex from '../../../src/trpc/index'

describe('tRPC Index Exports', () => {
    it('should export tRPC utilities from trpc.ts', () => {
        expect(trpcIndex.router).toBeDefined()
        expect(trpcIndex.procedure).toBeDefined()
        expect(trpcIndex.middleware).toBeDefined()
        expect(trpcIndex.createTRPCContext).toBeDefined()
        expect(trpcIndex.t).toBeDefined()
        expect(trpcIndex.transformErrorToTRPC).toBeDefined()
    })

    it('should export appRouter from router.ts', () => {
        expect(trpcIndex.appRouter).toBeDefined()
        expect(typeof trpcIndex.appRouter).toBe('object')
        expect(trpcIndex.appRouter._def).toBeDefined()
    })

    it('should export auth middleware functions', () => {
        expect(trpcIndex.authMiddleware).toBeDefined()
        expect(trpcIndex.billingMiddleware).toBeDefined()
        expect(trpcIndex.protectedProcedure).toBeDefined()
        expect(trpcIndex.billingProtectedProcedure).toBeDefined()
    })

    it('should export type inference utilities', () => {
        // These are type-only exports, but we can test that the module structure is correct
        const module = require('../../../src/trpc/index')
        expect(module.appRouter).toBeDefined()
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

    it('should have correct transformErrorToTRPC function', () => {
        expect(typeof trpcIndex.transformErrorToTRPC).toBe('function')

        const error = new Error('Test error')
        const trpcError = trpcIndex.transformErrorToTRPC(error)

        expect(trpcError).toBeDefined()
        expect(trpcError.code).toBe('INTERNAL_SERVER_ERROR')
        expect(trpcError.message).toBe('Test error')
    })

    it('should have correct t instance', () => {
        expect(trpcIndex.t).toBeDefined()
        expect(trpcIndex.t.router).toBeDefined()
        expect(trpcIndex.t.procedure).toBeDefined()
        expect(trpcIndex.t.middleware).toBeDefined()
    })

    it('should have working auth middleware', () => {
        expect(trpcIndex.authMiddleware).toBeDefined()
        expect(typeof trpcIndex.authMiddleware).toBe('object')
    })

    it('should have working billing middleware', () => {
        expect(trpcIndex.billingMiddleware).toBeDefined()
        expect(typeof trpcIndex.billingMiddleware).toBe('object')
    })

    it('should have working protected procedures', () => {
        expect(trpcIndex.protectedProcedure).toBeDefined()
        expect(trpcIndex.protectedProcedure._def).toBeDefined()
        expect(trpcIndex.protectedProcedure._def.middlewares).toBeDefined()
        expect(trpcIndex.protectedProcedure._def.middlewares.length).toBeGreaterThan(0)
    })

    it('should have working billing protected procedures', () => {
        expect(trpcIndex.billingProtectedProcedure).toBeDefined()
        expect(trpcIndex.billingProtectedProcedure._def).toBeDefined()
        expect(trpcIndex.billingProtectedProcedure._def.middlewares).toBeDefined()
        expect(trpcIndex.billingProtectedProcedure._def.middlewares.length).toBeGreaterThan(1) // Should have both auth and billing middleware
    })

    it('should maintain consistent exports with actual modules', () => {
        // Verify that exports match what's actually available
        const trpcModule = require('../../../src/trpc/trpc')
        const routerModule = require('../../../src/trpc/router')
        const authMiddlewareModule = require('../../../src/trpc/middleware/auth.middleware')

        expect(trpcIndex.router).toBe(trpcModule.router)
        expect(trpcIndex.procedure).toBe(trpcModule.procedure)
        expect(trpcIndex.appRouter).toBe(routerModule.appRouter)
        expect(trpcIndex.authMiddleware).toBe(authMiddlewareModule.authMiddleware)
    })
})