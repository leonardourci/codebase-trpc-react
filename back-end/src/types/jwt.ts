import { z } from 'zod'
import { validateTokenSchema } from '../utils/validations/jwt.schemas'

export enum TokenPurpose {
    EMAIL_VERIFICATION = 'email-verification',
    PASSWORD_RESET = 'password-reset'
}

export interface Token {
    userId: string
    purpose?: TokenPurpose
    iat?: number  // issued at
    exp?: number  // expiration time
}

export type ValidateTokenInput = z.infer<typeof validateTokenSchema>