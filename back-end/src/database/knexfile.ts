import { Knex } from 'knex'
import globalConfig from '../utils/global-config'
import path from 'path'

export const DEFAULT_TEST_DB_CONNECTION = 'postgresql://test_user:test_password@localhost:5435/test_db'

const config: Knex.Config = {
	client: 'pg',
	connection: globalConfig.nodeEnv === 'test' ? DEFAULT_TEST_DB_CONNECTION : globalConfig.databaseConnectionString,
	migrations: {
		tableName: 'knex_migrations',
		directory: path.join(__dirname, './migrations'),
		extension: globalConfig.nodeEnv === 'production' ? 'js' : 'ts'
	},
	seeds: {
		directory: path.join(__dirname, './seeds'),
		extension: globalConfig.nodeEnv === 'production' ? 'js' : 'ts'
	}
}

export default config
