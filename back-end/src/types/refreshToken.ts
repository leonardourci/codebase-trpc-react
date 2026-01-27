import { z } from 'zod'
import { refreshTokenSchema } from '../utils/validations/refresh-token.schemas'

export type TRefreshTokenInput = z.infer<typeof refreshTokenSchema>

export interface IRefreshTokenResponse {
    accessToken: string
    refreshToken: string
}