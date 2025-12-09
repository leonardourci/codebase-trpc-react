import jwt from 'jsonwebtoken'
import Joi from 'joi'

import { CustomError } from './errors'
import { EStatusCodes } from '../domain/statusCodes'
import { IPerformJsonCallback } from '../adapters/ExpressAdapter'

const { JWT_SECRET } = process.env

export const generateJwtToken = (payload: { userId: number }) => jwt.sign(payload, JWT_SECRET ?? '', { expiresIn: '1d' })

// @TODO remove the any from the response of this method
export const verifyJwtTokenHandler = (payload: { authorization: string }): IPerformJsonCallback<any> => {
	const { value, error } = Joi.object<{ authorization: string }>({
		authorization: Joi.string()
			.required()
			.custom((value, helpers) => {
				if (!value.startsWith('Bearer ')) {
					return helpers.error('any.invalid')
				}
				return value
			}, 'authorizationBearer')
	}).validate(payload, { abortEarly: false })

	if (error) throw new CustomError('TOKEN_NOT_FOUND', EStatusCodes.UNAUTHORIZED)

	try {
		const token = value.authorization.split('Bearer ')[1]

		jwt.verify(token!, JWT_SECRET ?? '')

		return {
			response: {},
			status: EStatusCodes.OK
		}
	} catch (tokenErr) {
		throw new CustomError('TOKEN_ERROR', EStatusCodes.UNAUTHORIZED)
	}
}
