// This file runs before each test file

import { DEFAULT_TEST_DB_CONNECTION } from '../../src/database/knexfile'

// Mock global-config to prevent real API keys from leaking into tests.
// global-config reads process.env at import time via dotenv, so setting
// process.env after import has no effect on the already-resolved config object.
jest.mock('../../src/utils/global-config', () => ({
	__esModule: true,
	default: {
		nodeEnv: 'test',
		restPort: '3001',
		databaseConnectionString: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/test_db',
		hashSalt: '10',
		jwtSecret: 'test-jwt-secret-key-for-integration-tests',
		stripeSecretKey: 'sk_test_fake_key_for_integration_tests',
		stripeWebhookSecret: 'whsec_test_fake_webhook_secret_for_integration_tests',
		allowedOrigins: ['http://localhost:5173'],
		googleClientId: 'test-google-client-id',
		resendApiKey: 're_test_fake_api_key',
		resendFromEmail: 'test@example.com',
		appUrl: 'http://localhost:5173'
	},
	DEFAULT_FRONTEND_LOCALHOST: 'http://localhost:5173'
}))

// Mock email modules to prevent any real email sending
jest.mock('../../src/services/email.service', () => ({
	sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('../../src/utils/email', () => ({
	sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined)
}))

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests'
process.env.HASH_SALT = '10'
process.env.REST_PORT = '3001'

process.env.DATABASE_CONNECTION_STRING = process.env.TEST_DATABASE_URL || DEFAULT_TEST_DB_CONNECTION

process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_integration_tests'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_fake_webhook_secret_for_integration_tests'

process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.RESEND_API_KEY = 're_test_fake_api_key'
process.env.RESEND_FROM_EMAIL = 'test@example.com'
process.env.APP_URL = 'http://localhost:5173'

// Increase timeout for integration tests
jest.setTimeout(30000)
