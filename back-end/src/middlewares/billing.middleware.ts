import Stripe from 'stripe'
import { NextFunction, Request, Response } from 'express'
import stripe from '../utils/stripe'
import globalConfig from '../utils/global-config'

export interface IBillingRequest extends Request {
	billingEvent?: Stripe.Event
}

export const verifyStripeWebhookSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
	const signature = req.headers['stripe-signature']
	if (!signature) {
		return res.sendStatus(400)
	}

	try {
		;(req as IBillingRequest).billingEvent = stripe.webhooks.constructEvent(req.body, signature, globalConfig.stripeWebhookSecret)
		return next()
	} catch (err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error'
		return res.sendStatus(400)
	}
}
