import { protectedProcedure } from '../middlewares/auth.middleware'
import { updateUserSchema } from '../../utils/validations/user.schemas'
import { getUserProfile, updateUserProfile } from '../../services/user.service'
import { requestEmailChangeSchema, verifyEmailChangeSchema } from '../../utils/validations/email.schemas'
import { requestEmailChange, verifyEmailChange } from '../../services/email.service'
import { router } from '..'

export const userRouter = router({
	getUserById: protectedProcedure.query(async ({ ctx }) => {
		return await getUserProfile({ userId: ctx.user.id })
	}),

	updateUserById: protectedProcedure.input(updateUserSchema).mutation(async ({ ctx, input }) => {
		return await updateUserProfile({ userId: ctx.user.id, updates: input })
	}),

	requestEmailChange: protectedProcedure.input(requestEmailChangeSchema).mutation(async ({ ctx, input }) => {
		return await requestEmailChange({ userId: ctx.user.id, newEmail: input.newEmail })
	}),

	verifyEmailChange: protectedProcedure.input(verifyEmailChangeSchema).mutation(async ({ ctx, input }) => {
		return await verifyEmailChange({ userId: ctx.user.id, code: input.code })
	})
})
