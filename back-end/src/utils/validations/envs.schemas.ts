import { z } from 'zod'
import { ENodeEnvs } from '../../types/envs'
import { DEFAULT_FRONTEND_LOCALHOST } from '../global-config'

export const globalEnvsSchema = z.object({
    NODE_ENV: z.enum([ENodeEnvs.DEVELOPMENT, ENodeEnvs.PRODUCTION, ENodeEnvs.TEST]).default(ENodeEnvs.DEVELOPMENT),
    REST_PORT: z.coerce.number().int().positive(),
    DATABASE_CONNECTION_STRING: z.string().min(1, 'Database connection string is required'),
    HASH_SALT: z.coerce.number().int().positive(),
    JWT_SECRET: z.string().min(1, 'JWT secret is required'),
    STRIPE_SECRET_KEY: z.string().min(1, 'Stripe secret key is required'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, 'Stripe webhook secret is required'),
    ALLOWED_ORIGINS: z.string().optional().default(DEFAULT_FRONTEND_LOCALHOST),
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
    RESEND_API_KEY: z.string().min(1, 'Resend API key is required'),
    RESEND_FROM_EMAIL: z.string().email('Valid sender email is required'),
    APP_URL: z.string().url('Valid app URL is required').refine(url => !url.endsWith('/'), 'APP_URL should not end with a slash')
})
