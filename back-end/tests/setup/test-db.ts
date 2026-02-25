import knex, { Knex } from 'knex'
import { DEFAULT_TEST_DB_CONNECTION } from '../../src/database/knexfile'

let _testDb: Knex | null = null

export function getTestDb(): Knex {
	if (!_testDb) {
		_testDb = knex({
			client: 'pg',
			connection: process.env.TEST_DATABASE_URL || DEFAULT_TEST_DB_CONNECTION,
			migrations: {
				tableName: 'knex_migrations',
				directory: './src/database/migrations',
				extension: 'ts'
			}
		})
	}
	return _testDb
}

export async function closeTestDb(): Promise<void> {
	if (_testDb) {
		await _testDb.destroy()
		_testDb = null
	}
}

export async function cleanTestData(): Promise<void> {
	const db = getTestDb()

	const tables = await db.raw(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename != 'knex_migrations'
        AND tablename != 'knex_migrations_lock'
    `)

	for (const table of tables.rows) {
		await db.raw(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`)
	}
}

/**
 * Seeds a free tier product for tests that require user creation.
 * Call this explicitly in tests that create users (e.g., auth, billing integration tests).
 */
export async function seedFreeTierProduct(): Promise<void> {
	const db = getTestDb()

	await db('products').insert({
		name: 'Free Tier',
		description: 'Free tier for testing',
		price_in_cents: 0,
		external_product_id: null,
		external_price_id: null,
		active: true,
		is_free_tier: true,
		max_projects: 5
	})
}
