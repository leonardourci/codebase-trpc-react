import { RequestHandler } from 'express'
import stripe from '../utils/stripe'
import globalConfig from '../utils/globalConfig'

export const verifyStripeWebhookSignature: RequestHandler = (req, res, next) => {
	const signature = req.headers['stripe-signature']
	if (!signature) {
		console.log('⚠️  No Stripe signature found on request')
		return res.sendStatus(400)
	}

	try {
		(req as any).stripeEvent = stripe
			.webhooks
			.constructEvent(
				req.body,
				signature,
				globalConfig.stripeSecretKey
			)

		next()
	} catch (err: any) {
		console.log(`⚠️  Webhook signature verification failed.`, err.message)
		return res.sendStatus(400)
	}
}
