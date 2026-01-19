import Joi, { ValidationResult } from 'joi'

import { ICreateCheckoutSessionPayload, ICreatePortalSessionPayload } from '../../types/billing'

export const validateCreateCheckoutSessionPayload = (payload: ICreateCheckoutSessionPayload): ValidationResult<ICreateCheckoutSessionPayload> =>
	Joi.object({
		productId: Joi.string().required(),
		successUrl: Joi.string().uri().required(),
		cancelUrl: Joi.string().uri().required(),
		token: Joi.string().required()
	}).validate(payload, { abortEarly: false })

export const validateCreatePortalSessionPayload = (payload: ICreatePortalSessionPayload): ValidationResult<ICreatePortalSessionPayload> =>
	Joi.object({
		returnUrl: Joi.string().uri().required(),
		token: Joi.string().required()
	}).validate(payload, { abortEarly: false })
