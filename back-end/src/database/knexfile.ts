import { Knex } from 'knex'
import globalConfig from '../utils/globalConfig'

const config: Knex.Config = {
	client: 'pg',
	connection: globalConfig.nodeEnv === 'test'
		? 'postgresql://test_user:test_password@localhost:5433/test_db'
		: globalConfig.databaseConnectionString,
	migrations: {
		tableName: 'knex_migrations',
		directory: './src/db/migrations',
		extension: 'ts'
	}
}

export default config
