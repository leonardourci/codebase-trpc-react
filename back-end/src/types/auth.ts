import { z } from 'zod'
import { loginSchema, signupSchema } from '../utils/validations/auth.schemas'

export type LoginInput = z.infer<typeof loginSchema>

export interface LoginResponse {
	accessToken: string
	refreshToken: string
}

export type SignupInput = z.infer<typeof signupSchema>
