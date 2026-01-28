import jwt from 'jsonwebtoken'

import { CustomError, ZodValidationError } from './errors'
import { EStatusCodes } from './status-codes'
import globalConfig from './global-config'
import { IUser } from '../types/user'
import { TValidateTokenInput, IToken } from '../types/jwt'
import { validateTokenSchema } from './validations/jwt.schemas'

export const generateJwtToken = (input: { userId: IUser['id'] }, options?: jwt.SignOptions) => {
	return jwt.sign(input, globalConfig.jwtSecret, options)
}

export const verifyJwtToken = (input: TValidateTokenInput): void => {
	const { data, error } = validateTokenSchema.safeParse(input)

	if (error) throw new ZodValidationError(error)

	try {
		const token = data!.token.split('Bearer ')[1]

		jwt.verify(token!, globalConfig.jwtSecret)
	} catch (err) {
		throw new CustomError(`TOKEN_ERROR: ${err}`, EStatusCodes.UNAUTHORIZED)
	}
}

export const decodeJwtToken = (input: TValidateTokenInput): IToken => {
	const { data, error } = validateTokenSchema.safeParse({ token: input.token })

	if (error) throw new ZodValidationError(error)

	const token = data.token.split('Bearer ')[1] as string

	return jwt.decode(token) as IToken
}