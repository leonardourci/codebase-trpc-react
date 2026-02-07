import { router } from '.'
import { authRouter } from './routers/auth.router'
import { billingRouter } from './routers/billing.router'
import { productRouter } from './routers/product.router'
import { userRouter } from './routers/user.router'

export const appRouter = router({
	auth: authRouter,
	billing: billingRouter,
	product: productRouter,
	user: userRouter
})

// Export the router type for client-side usage
export type AppRouter = typeof appRouter
