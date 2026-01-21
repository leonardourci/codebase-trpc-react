import knex from 'knex'

export default async function globalSetup() {
    console.log('🚀 Setting up test database...')

    const connectionString = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/postgres'
    const testDbName = 'test_db'

    const adminDb = knex({
        client: 'pg',
        connection: connectionString
    })

    try {
        await adminDb.raw(`DROP DATABASE IF EXISTS "${testDbName}"`)
        await adminDb.raw(`CREATE DATABASE "${testDbName}"`)
        console.log(`✅ Test database "${testDbName}" created`)

        const testDb = knex({
            client: 'pg',
            connection: connectionString.replace(/\/[^\/]*$/, `/${testDbName}`),
            migrations: {
                tableName: 'knex_migrations',
                directory: './src/db/migrations',
                extension: 'ts'
            }
        })

        await testDb.migrate.latest()
        console.log('✅ Test database migrations completed')

        await testDb.destroy()
    } finally {
        await adminDb.destroy()
    }

    console.log('✅ Test database setup complete')
}