import { router } from './trpc'
import { authRouter } from './routers/auth.router'

export const appRouter = router({
  auth: authRouter
})

// Export the router type for client-side usage
export type AppRouter = typeof appRouter