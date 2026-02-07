import knex from 'knex'
import { closeTestDb } from './test-db'
import { DEFAULT_TEST_DB_CONNECTION } from '../../src/database/knexfile'
import Logger from '../../src/utils/logger'

const logger = new Logger({ source: 'GLOBAL-TEARDOWN' })

export default async function globalTeardown() {
	logger.info('🧹 Tearing down test database...')

	// Close the test database connection first
	await closeTestDb()

	// Small delay to ensure connection is fully closed
	await new Promise((resolve) => setTimeout(resolve, 100))

	const connectionString = process.env.TEST_DATABASE_URL || DEFAULT_TEST_DB_CONNECTION
	const testDbName = 'test_db'

	// Connect to postgres database (not test_db) to be able to drop the test database
	const postgresConnectionString = connectionString.replace(/\/[^\/]*$/, '/postgres')

	const adminDb = knex({
		client: 'pg',
		connection: postgresConnectionString
	})

	try {
		// Force close all connections to the test database
		await adminDb.raw(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()
        `)

		await adminDb.raw(`DROP DATABASE IF EXISTS "${testDbName}"`)
		logger.info(`✅ Test database "${testDbName}" dropped`)
	} finally {
		await adminDb.destroy()
	}

	logger.info('✅ Test database teardown complete')
}
