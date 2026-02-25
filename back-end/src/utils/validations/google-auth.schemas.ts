import { z } from 'zod'

export const googleAuthSchema = z.object({
	credential: z.string().min(1, 'Google credential is required')
})

export type TGoogleAuthInput = z.infer<typeof googleAuthSchema>

export const googleTokenPayloadSchema = z.object({
	sub: z.string().min(1, 'Google user ID (sub) is required'),
	email: z.string().email('Valid email is required'),
	name: z.string().min(1, 'Name is required'),
	email_verified: z.boolean().optional(),
	picture: z.string().optional(),
	given_name: z.string().optional(),
	family_name: z.string().optional()
})

export type TGoogleTokenPayload = z.infer<typeof googleTokenPayloadSchema>
