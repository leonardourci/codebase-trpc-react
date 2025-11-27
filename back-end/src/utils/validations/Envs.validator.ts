import Joi from 'joi'
import type { ValidationResult } from 'joi'
import { JoiValidationError } from '../errors'

export enum ENodeEnvs {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test'
}

export interface IEnvs {
  NODE_ENV: ENodeEnvs
  REST_PORT: number
  PG_CONNECTION_STRING: string
  HASH_SALT: number
  JWT_SECRET: string
}

export class Envs {
  constructor() {
    const { error } = this.validate(process.env)
    if (error) {
      throw new JoiValidationError(error)
    }
  }

  get nodeEnv(): ENodeEnvs {
    return process.env.NODE_ENV as ENodeEnvs
  }

  get restPort(): number {
    return Number(process.env.REST_PORT)
  }

  get pgConnectionString(): string {
    return process.env.PG_CONNECTION_STRING as string
  }

  get hashSalt(): number {
    return Number(process.env.HASH_SALT)
  }

  private validate = (payload: unknown): ValidationResult<IEnvs> =>
    Joi.object({
      NODE_ENV: Joi.string().valid(...Object.values(ENodeEnvs)).required(),
      REST_PORT: Joi.number().integer().positive().required(),
      PG_CONNECTION_STRING: Joi.string().required(),
      HASH_SALT: Joi.number().integer().positive().required(),
      JWT_SECRET: Joi.string().required()
    }).validate(payload, { allowUnknown: true, abortEarly: false })
}
