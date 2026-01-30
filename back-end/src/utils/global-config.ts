import path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env.backend') })

import { ZodValidationError } from './errors'
import { globalEnvsSchema } from './validations/envs.schemas'

export const DEFAULT_FRONTEND_LOCALHOST = 'http://localhost:5173'

const { data, error } = globalEnvsSchema.safeParse(process.env)

if (error) {
	throw new ZodValidationError(error)
}

export default {
	nodeEnv: data.NODE_ENV,
	restPort: data.REST_PORT,
	databaseConnectionString: data.DATABASE_CONNECTION_STRING,
	hashSalt: data.HASH_SALT,
	jwtSecret: data.JWT_SECRET,
	stripeSecretKey: data.STRIPE_SECRET_KEY,
	stripeWebhookSecret: data.STRIPE_WEBHOOK_SECRET,
	allowedOrigins: (data.ALLOWED_ORIGINS || DEFAULT_FRONTEND_LOCALHOST).split(',').map(origin => origin.trim()),
	googleClientId: data.GOOGLE_CLIENT_ID,
	resendApiKey: data.RESEND_API_KEY,
	resendFromEmail: data.RESEND_FROM_EMAIL,
	appUrl: data.APP_URL
} as const
