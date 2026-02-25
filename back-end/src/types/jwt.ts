import { z } from 'zod'
import { validateTokenSchema } from '../utils/validations/jwt.schemas'
import { User } from './user'

export enum TokenPurpose {
	EMAIL_VERIFICATION = 'email-verification',
	PASSWORD_RESET = 'password-reset',
	EMAIL_CHANGE = 'email-change'
}

type TokenByPurpose =
	| {
			purpose?: TokenPurpose.EMAIL_CHANGE
			code: string
			newEmail: string
			attempts: number
			iat: number
	  }
	| {
			purpose?: TokenPurpose.EMAIL_VERIFICATION | TokenPurpose.PASSWORD_RESET
	  }

export type Token = {
	userId: string
	purpose?: TokenPurpose
	iat?: number // issued at
	exp?: number // expiration time
} & TokenByPurpose

export type GenerateTokenInput = {
	userId: User['id']
} & TokenByPurpose

export type ValidateTokenInput = z.infer<typeof validateTokenSchema>
