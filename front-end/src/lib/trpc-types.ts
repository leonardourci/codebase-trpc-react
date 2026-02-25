import type { inferRouterOutputs, inferRouterInputs } from '@trpc/server'
import type { AppRouter } from '../../../back-end/src/trpc/router'

export type RouterOutputs = inferRouterOutputs<AppRouter>
export type RouterInputs = inferRouterInputs<AppRouter>

export type UserProfile = NonNullable<RouterOutputs['user']['getUserById']>
export type Product = RouterOutputs['product']['getAll'][number]
export type UserBilling = RouterOutputs['billing']['getUserBilling']
export type Billing = NonNullable<RouterOutputs['billing']['getUserBilling']['billing']>

export type LoginInput = RouterInputs['auth']['login']
export type SignupInput = RouterInputs['auth']['signup']
export type LoginResponse = RouterOutputs['auth']['login']
export type UpdateUserInput = RouterInputs['user']['updateUserById']
