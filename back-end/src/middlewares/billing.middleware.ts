import Stripe from 'stripe'
import { NextFunction, Request, Response } from 'express'
import stripe from '../utils/stripe'
import globalConfig from '../utils/globalConfig'
import { decodeJwtToken } from '../utils/jwt'
import { getBillingByUserId } from '../database/repositories/billing.repository'
import { EStatusCodes } from '../utils/statusCodes'
import { getUserById } from '../database/repositories/user.repository'

export interface BillingRequest extends Request {
	billingEvent?: Stripe.Event
}

export const verifyStripeWebhookSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const signature = req.headers['stripe-signature']
	if (!signature) {
		console.log('⚠️  No Stripe signature found on request')
		return res.sendStatus(400)
	}

	try {
		; (req as BillingRequest).billingEvent = stripe.webhooks.constructEvent(req.body, signature, globalConfig.stripeSecretKey)
		return next()
	} catch (err: any) {
		console.log(`⚠️  Webhook signature verification failed.`, err.message)
		return res.sendStatus(400)
	}
}

export const verifyIfUserBillingHasExpiredMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { userId } = decodeJwtToken({ token: req.headers['authorization'] as string })
		const user = await getUserById({ id: userId })
		if (!user) {
			return res.status(EStatusCodes.NOT_FOUND).json({ error: 'User not found' })
		}
		const userBilling = await getBillingByUserId({ userId })
		if (!userBilling || userBilling.expiresAt < new Date()) {
			return res.status(EStatusCodes.UNAUTHORIZED).json({ error: 'User billing has expired' })
		}
		next()
	} catch (err: any) {
		return res.status(EStatusCodes.UNAUTHORIZED).json({ error: err.message })
	}
}
