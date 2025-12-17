import Joi, { ValidationResult } from 'joi'

import { ILoginPayload, ISignupPayload } from '../../types/auth'

export const validateLoginPayload = (payload: ILoginPayload): ValidationResult<ILoginPayload> =>
	Joi.object({
		email: Joi.string().required(),
		password: Joi.string().required()
	}).validate(payload, { abortEarly: false })

export const validateSignupPayload = (payload: ISignupPayload): ValidationResult<ISignupPayload> =>
	Joi.object({
		firstName: Joi.string().required(),
		lastName: Joi.string().required(),
		email: Joi.string().email().required(),
		phone: Joi.string().required(),
		password: Joi.string().required(),
		age: Joi.number().integer().positive().required()
	}).validate(payload, { abortEarly: false })
