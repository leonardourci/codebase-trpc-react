import Joi, { ValidationResult } from 'joi'
import { ENodeEnvs, IEnvs } from '../../types/envs'

export const validateGlobalEnvs = (payload: unknown): ValidationResult<IEnvs> =>
	Joi.object({
		NODE_ENV: Joi.string()
			.valid(...Object.values(ENodeEnvs))
			.required(),
		REST_PORT: Joi.number().integer().positive().required(),
		DATABASE_CONNECTION_STRING: Joi.string().required(),
		HASH_SALT: Joi.number().integer().positive().required(),
		JWT_SECRET: Joi.string().required()
	}).validate(payload, { allowUnknown: true, abortEarly: false })
