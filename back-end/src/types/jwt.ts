import { z } from 'zod'
import { validateTokenSchema } from '../utils/validations/jwt.schemas'

export interface IToken {
    userId: string
    iat?: number  // issued at
    exp?: number  // expiration time
}

export type TValidateTokenInput = z.infer<typeof validateTokenSchema>