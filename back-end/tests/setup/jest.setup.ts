// Jest setup file for integration tests
// This file runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
process.env.HASH_SALT = '10';
process.env.REST_PORT = '3001'; // Different port for test server

// Set test database connection string
// Using PostgreSQL test database for integration tests
process.env.DATABASE_CONNECTION_STRING = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/test_db';

// Stripe test configuration
process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_integration_tests';

// Increase timeout for integration tests
jest.setTimeout(30000);