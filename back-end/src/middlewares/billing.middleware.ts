import Stripe from 'stripe'
import { NextFunction, Request, Response } from 'express'
import stripe from '../utils/stripe'
import globalConfig from '../utils/global-config'
import Logger from '../utils/logger'

const logger = new Logger({ source: 'BILLING-MIDDLEWARE' })

export interface BillingRequest extends Request {
	billingEvent?: Stripe.Event
}

export const verifyStripeWebhookSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const signature = req.headers['stripe-signature']
	if (!signature) {
		logger.warn('No Stripe signature found on request')
		return res.sendStatus(400)
	}

	try {
		; (req as BillingRequest).billingEvent = stripe.webhooks.constructEvent(req.body, signature, globalConfig.stripeWebhookSecret)
		return next()
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error'
		logger.error(errorMessage, err)
		return res.sendStatus(400)
	}
}
