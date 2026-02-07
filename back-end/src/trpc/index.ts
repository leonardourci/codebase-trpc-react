import { initTRPC } from '@trpc/server'
import { Request, Response } from 'express'

import { ENodeEnvs } from '../types/envs'
import { IUser } from '../types/user'
import globalConfig from '../utils/global-config'

export interface ITRPCContext {
	user?: IUser
	req: Request
	res: Response
}

export const createTRPCContext = (opts: { req: Request; res: Response }): ITRPCContext => {
	return {
		req: opts.req,
		res: opts.res
		// user will be populated by authentication middleware
	}
}

export const t = initTRPC.context<ITRPCContext>().create({
	errorFormatter({ shape, error }) {
		const isProduction = globalConfig.nodeEnv === ENodeEnvs.PRODUCTION

		// In production, remove sensitive data like stack traces and internal paths
		// In development, keep full error details for debugging
		if (isProduction) {
			// Sanitize error message for production - hide database/internal details
			const sanitizedMessage =
				shape.message.includes('column') || shape.message.includes('table') || shape.message.includes('database')
					? 'An internal error occurred. Please try again later.'
					: shape.message

			return {
				...shape,
				message: sanitizedMessage,
				data: {
					code: shape.data.code,
					httpStatus: shape.data.httpStatus,
					path: shape.data.path
				}
			}
		}

		// Development: include full error details for debugging
		return {
			...shape,
			data: {
				...shape.data,
				details: error.cause
			}
		}
	}
})

export const router = t.router
export const procedure = t.procedure
export const middleware = t.middleware
