import jwt from 'jsonwebtoken'

import { TGenerateTokenInput, TToken, TValidateTokenInput } from '../types/jwt'
import { CustomError, ZodValidationError } from './errors'
import globalConfig from './global-config'
import { EStatusCodes } from './status-codes'
import { validateTokenSchema } from './validations/jwt.schemas'

export const generateJwtToken = (input: TGenerateTokenInput, options?: jwt.SignOptions) => {
	return jwt.sign(input, globalConfig.jwtSecret, options)
}

export const verifyJwtToken = (input: TValidateTokenInput): void => {
	const { data, error } = validateTokenSchema.safeParse(input)

	if (error) throw new ZodValidationError(error)

	try {
		jwt.verify(data.token, globalConfig.jwtSecret)
	} catch (err) {
		throw new CustomError(`TOKEN_ERROR: ${err}`, EStatusCodes.UNAUTHORIZED)
	}
}

export const decodeJwtToken = (input: TValidateTokenInput): TToken => {
	const { data, error } = validateTokenSchema.safeParse({ token: input.token })

	if (error) throw new ZodValidationError(error)

	return jwt.decode(data.token) as TToken
}
