import knex from 'knex'
import { DEFAULT_TEST_DB_CONNECTION } from '../../src/database/knexfile'
import Logger from '../../src/utils/logger'

const logger = new Logger({ source: 'GLOBAL-SETUP' })

export default async function globalSetup() {
	logger.info('🚀 Setting up test database...')

	const connectionString = process.env.TEST_DATABASE_URL || DEFAULT_TEST_DB_CONNECTION
	const testDbName = 'test_db'

	// Connect to postgres database (not test_db) to be able to drop/create the test database
	const postgresConnectionString = connectionString.replace(/\/[^\/]*$/, '/postgres')

	const adminDb = knex({
		client: 'pg',
		connection: postgresConnectionString
	})

	try {
		await adminDb.raw(`DROP DATABASE IF EXISTS "${testDbName}"`)
		await adminDb.raw(`CREATE DATABASE "${testDbName}"`)
		logger.info(`✅ Test database "${testDbName}" created`)

		const testDb = knex({
			client: 'pg',
			connection: connectionString.replace(/\/[^\/]*$/, `/${testDbName}`),
			migrations: {
				tableName: 'knex_migrations',
				directory: './src/database/migrations',
				extension: 'ts'
			}
		})

		await testDb.migrate.latest()
		logger.info('✅ Test database migrations completed')

		await testDb.destroy()
	} finally {
		await adminDb.destroy()
	}

	logger.info('✅ Test database setup complete')
}
