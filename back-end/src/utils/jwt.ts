import jwt from 'jsonwebtoken'

import { CustomError, ZodValidationError } from './errors'
import { StatusCodes } from './status-codes'
import globalConfig from './global-config'
import { ValidateTokenInput, Token, type GenerateTokenInput } from '../types/jwt'
import { validateTokenSchema } from './validations/jwt.schemas'

export const generateJwtToken = (input: GenerateTokenInput, options?: jwt.SignOptions) => {
	return jwt.sign(input, globalConfig.jwtSecret, options)
}

export const verifyJwtToken = (input: ValidateTokenInput): void => {
	const { data, error } = validateTokenSchema.safeParse(input)

	if (error) throw new ZodValidationError(error)

	try {
		jwt.verify(data.token, globalConfig.jwtSecret)
	} catch (err) {
		throw new CustomError(`TOKEN_ERROR: ${err}`, StatusCodes.UNAUTHORIZED)
	}
}

export const decodeJwtToken = (input: ValidateTokenInput): Token => {
	const { data, error } = validateTokenSchema.safeParse({ token: input.token })

	if (error) throw new ZodValidationError(error)

	return jwt.decode(data.token) as Token
}
