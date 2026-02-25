import jwt from 'jsonwebtoken'

import { CustomError, ZodValidationError } from './errors'
import { StatusCodes } from './status-codes'
import globalConfig from './global-config'
import { User } from '../types/user'
import { ValidateTokenInput, Token, TokenPurpose } from '../types/jwt'
import { validateTokenSchema } from './validations/jwt.schemas'

export const generateJwtToken = (input: { userId: User['id']; purpose?: TokenPurpose }, options?: jwt.SignOptions) => {
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

export const verifyJwtTokenSimple = ({ token }: { token: string }): { userId: string; purpose?: TokenPurpose } => {
	try {
		const decoded = jwt.verify(token, globalConfig.jwtSecret) as { userId: string; purpose?: TokenPurpose }
		return decoded
	} catch (err) {
		throw new CustomError(`Invalid or expired token: ${err}`, StatusCodes.UNAUTHORIZED)
	}
}