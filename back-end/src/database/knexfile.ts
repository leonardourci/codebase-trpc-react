import { Knex } from 'knex'
import globalConfig from '../utils/global-config'
import path from 'path'

const config: Knex.Config = {
	client: 'pg',
	connection: globalConfig.nodeEnv === 'test'
		? 'postgresql://test_user:test_password@localhost:5433/test_db'
		: globalConfig.databaseConnectionString,
	migrations: {
		tableName: 'knex_migrations',
		directory: path.join(__dirname, '../db/migrations'),
		extension: globalConfig.nodeEnv === 'production' ? 'js' : 'ts'
	}
}

export default config
