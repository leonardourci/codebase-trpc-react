import { router, procedure } from '../trpc'
import { protectedProcedure } from '../middleware/auth.middleware'
import { loginSchema, signupSchema } from '../../utils/validations/auth.schemas'
import { refreshTokenSchema } from '../../utils/validations/refresh-token.schemas'
import { authenticateUser, registerUser, refreshAccessToken, revokeUserRefreshToken } from '../../services/auth.service'

export const authRouter = router({
    login: procedure
        .input(loginSchema)
        .mutation(async ({ input }) => {
            return await authenticateUser(input)
        }),

    signup: procedure
        .input(signupSchema)
        .mutation(async ({ input }) => {
            return await registerUser(input)
        }),

    refresh: procedure
        .input(refreshTokenSchema)
        .mutation(async ({ input }) => {
            return await refreshAccessToken(input)
        }),

    logout: protectedProcedure
        .mutation(async ({ ctx }) => {
            await revokeUserRefreshToken(ctx.user!.id)
            return { success: true }
        })
})