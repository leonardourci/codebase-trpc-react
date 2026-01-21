import knex from 'knex'
import { closeTestDb } from './test-db'

export default async function globalTeardown() {
    console.log('🧹 Tearing down test database...')

    // Close the test database connection first
    await closeTestDb()

    // Small delay to ensure connection is fully closed
    await new Promise(resolve => setTimeout(resolve, 100))

    const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/postgres'
    const testDbName = 'test_db'

    const adminDb = knex({
        client: 'pg',
        connection: connectionString
    })

    try {
        // Force close all connections to the test database
        await adminDb.raw(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '${testDbName}' AND pid <> pg_backend_pid()
        `)

        await adminDb.raw(`DROP DATABASE IF EXISTS "${testDbName}"`)
        console.log(`✅ Test database "${testDbName}" dropped`)
    } finally {
        await adminDb.destroy()
    }

    console.log('✅ Test database teardown complete')
}