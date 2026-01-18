import jwt from 'jsonwebtoken'
import Joi from 'joi'

import { CustomError } from './errors'
import { EStatusCodes } from './statusCodes'
import globalConfig from './globalConfig'
import { IUser } from '../types/user'

export interface IValidateTokenPayload {
	token: string
}

export interface IToken {
	userId: IUser['id']
}

const validateToken = (payload: IValidateTokenPayload) => {
	return Joi.object<IValidateTokenPayload>({
		token: Joi.string()
			.required()
			.not()
			.empty()
			.custom((value, helpers) => {
				if (!value.startsWith('Bearer ')) {
					return helpers.error('any.invalid')
				}
				return value
			}, 'authorizationBearer')
	}).validate(payload, { abortEarly: false })
}

export const generateJwtToken = (payload: { userId: IUser['id'] }) => jwt.sign(payload, globalConfig.jwtSecret, { expiresIn: '1d' })

export const verifyJwtToken = (payload: IValidateTokenPayload): void => {
	const { value, error } = validateToken(payload)

	if (error) throw new CustomError('TOKEN_NOT_FOUND', EStatusCodes.UNAUTHORIZED)

	try {
		const token = value.token.split('Bearer ')[1]

		jwt.verify(token!, globalConfig.jwtSecret)
	} catch (err) {
		throw new CustomError(`TOKEN_ERROR: ${err}`, EStatusCodes.UNAUTHORIZED)
	}
}

export const decodeJwtToken = ({ token }: IValidateTokenPayload): IToken => {
	validateToken({ token })
	return jwt.decode(token) as IToken
}
