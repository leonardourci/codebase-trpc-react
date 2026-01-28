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
                directory: './src/db/migrations',
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