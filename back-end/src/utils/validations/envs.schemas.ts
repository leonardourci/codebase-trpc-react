import { z } from 'zod'
import { ENodeEnvs } from '../../types/envs'
import { DEFAULT_FRONTEND_LOCALHOST } from '../global-config'

export const globalEnvsSchema = z.object({
    NODE_ENV: z.enum([ENodeEnvs.DEVELOPMENT, ENodeEnvs.PRODUCTION, ENodeEnvs.TEST]),
    REST_PORT: z.coerce.number().int().positive(),
    DATABASE_CONNECTION_STRING: z.string().min(1, 'Database connection string is required'),
    HASH_SALT: z.coerce.number().int().positive(),
    JWT_SECRET: z.string().min(1, 'JWT secret is required'),
    STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
    ALLOWED_ORIGINS: z.string().optional().default(DEFAULT_FRONTEND_LOCALHOST),
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required')
})
