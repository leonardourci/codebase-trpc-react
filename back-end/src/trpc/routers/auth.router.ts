import { router, procedure } from '../trpc'
import { loginSchema, signupSchema } from '../../utils/validations/auth.schemas'
import { authenticateUser, registerUser } from '../../services/auth.service'

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
        })
})