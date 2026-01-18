import { NextFunction, Request, Response } from 'express'
import { verifyJwtToken } from '../utils/jwt'
import { EStatusCodes } from '../utils/statusCodes'

export const verifyUserTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const token = req.headers['authorization']

	try {
		verifyJwtToken({ token: token || '' })
		return next()
	} catch (err: any) {
		res.status(EStatusCodes.UNAUTHORIZED).json({ error: err.message })
	}
}
