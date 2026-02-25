import z from 'zod'

export const requestEmailChangeSchema = z.object({
	newEmail: z.email('Invalid email format')
})

export const verifyEmailChangeSchema = z.object({
	code: z.string().length(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only digits')
})
