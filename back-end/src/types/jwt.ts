import { z } from 'zod'
import { validateTokenSchema } from '../utils/validations/jwt.schemas'
import { IUser } from './user'

export enum ETokenPurpose {
	EMAIL_VERIFICATION = 'email-verification',
	PASSWORD_RESET = 'password-reset',
	EMAIL_CHANGE = 'email-change'
}

type TTokenByPurpose =
	| {
			purpose?: ETokenPurpose.EMAIL_CHANGE
			code: string
			newEmail: string
			attempts: number
			iat: number
	  }
	| {
			purpose?: ETokenPurpose.EMAIL_VERIFICATION | ETokenPurpose.PASSWORD_RESET
	  }

export type TGenerateTokenInput = {
	userId: IUser['id']
} & TTokenByPurpose

export type TToken = {
	userId: string
	iat?: number // issued at
	exp?: number // expiration time
} & TTokenByPurpose

export type TValidateTokenInput = z.infer<typeof validateTokenSchema>
