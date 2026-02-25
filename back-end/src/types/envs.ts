import { z } from 'zod'
import { globalEnvsSchema } from '../utils/validations/envs.schemas'

export enum NodeEnv {
	DEVELOPMENT = 'development',
	PRODUCTION = 'production',
	TEST = 'test'
}

export type TGlobalEnvsInput = z.infer<typeof globalEnvsSchema>
