import { z } from 'zod'
import { refreshTokenSchema } from '../utils/validations/refresh-token.schemas'

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>

export interface RefreshTokenResponse {
    accessToken: string
    refreshToken: string
}