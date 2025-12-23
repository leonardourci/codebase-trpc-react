export enum ENodeEnvs {
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	TEST = 'test'
}

export interface IEnvs {
	NODE_ENV: ENodeEnvs
	REST_PORT: number
	DATABASE_CONNECTION_STRING: string
	HASH_SALT: number
	JWT_SECRET: string
	STRIPE_SECRET_KEY: string
}
