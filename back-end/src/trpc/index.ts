export { router, procedure, middleware, createTRPCContext, t, transformErrorToTRPC } from './trpc'
export { appRouter } from './router'
export { authMiddleware, billingMiddleware, protectedProcedure, billingProtectedProcedure } from './middleware/auth.middleware'

export type { ITRPCContext } from './trpc'
export type { AppRouter } from './router'

import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from './router'

export type TRouterInputs = inferRouterInputs<AppRouter>
export type TRouterOutputs = inferRouterOutputs<AppRouter>