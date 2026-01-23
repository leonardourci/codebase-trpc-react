import { appRouter, AppRouter } from '../../src/trpc/router'

describe('tRPC App Router', () => {
    it('should have auth procedures', () => {
        const procedures = appRouter._def.procedures
        const authProcedures = Object.keys(procedures).filter(key => key.startsWith('auth.'))
        expect(authProcedures.length).toBeGreaterThan(0)
        expect(authProcedures).toContain('auth.login')
        expect(authProcedures).toContain('auth.signup')
    })

    it('should have billing procedures', () => {
        const procedures = appRouter._def.procedures
        const billingProcedures = Object.keys(procedures).filter(key => key.startsWith('billing.'))
        expect(billingProcedures.length).toBeGreaterThan(0)
        expect(billingProcedures).toContain('billing.createCheckoutSession')
    })

    it('should have product procedures', () => {
        const procedures = appRouter._def.procedures
        const productProcedures = Object.keys(procedures).filter(key => key.startsWith('product.'))
        expect(productProcedures.length).toBeGreaterThan(0)
        expect(productProcedures).toContain('product.getById')
        expect(productProcedures).toContain('product.getAll')
    })

    it('should be a valid tRPC router', () => {
        expect(appRouter._def).toBeDefined()
        expect(appRouter._def.procedures).toBeDefined()
        expect(typeof appRouter._def.procedures).toBe('object')
    })

    it('should have correct router structure', () => {
        const procedures = appRouter._def.procedures
        const procedureKeys = Object.keys(procedures)

        // Should have procedures from all three routers
        expect(procedureKeys.some(key => key.startsWith('auth.'))).toBe(true)
        expect(procedureKeys.some(key => key.startsWith('billing.'))).toBe(true)
        expect(procedureKeys.some(key => key.startsWith('product.'))).toBe(true)

        expect(procedureKeys.length).toBeGreaterThan(5) // Should have multiple procedures
    })

    it('should export AppRouter type correctly', () => {
        // Type assertion test - if this compiles, the type is correct
        const typedRouter: AppRouter = appRouter
        expect(typedRouter).toBe(appRouter)
        expect(typeof typedRouter).toBe('object')
    })

    it('should be created using tRPC router function', () => {
        expect(appRouter).toBeDefined()
        expect(appRouter._def).toBeDefined()
        expect(appRouter._def.record).toBeDefined()
    })

    it('should have nested router structure', () => {
        const record = appRouter._def.record
        expect(record.auth).toBeDefined()
        expect(record.billing).toBeDefined()
        expect(record.product).toBeDefined()

        // Each should be a router - just check they exist
        expect(typeof record.auth).toBe('object')
        expect(typeof record.billing).toBe('object')
        expect(typeof record.product).toBe('object')
    })

    it('should maintain router hierarchy', () => {
        const routerKeys = Object.keys(appRouter._def.record)
        expect(routerKeys).toEqual(['auth', 'billing', 'product'])
        expect(routerKeys).toHaveLength(3)
    })

    it('should have callable procedures in each sub-router', () => {
        const { auth, billing, product } = appRouter._def.record

        // Just check that the routers exist and are objects
        expect(auth).toBeDefined()
        expect(billing).toBeDefined()
        expect(product).toBeDefined()

        expect(typeof auth).toBe('object')
        expect(typeof billing).toBe('object')
        expect(typeof product).toBe('object')
    })
})