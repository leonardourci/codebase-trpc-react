import { Response } from 'express'

import { IBillingRequest } from '../middlewares/billing.middleware'
import { getProductByExternalPriceId } from '../database/repositories/product.repository'
import {
	registerUserBilling,
	updateBillingOnPaymentFailed,
	updateBillingOnSubscriptionUpdated,
	updateBillingOnSubscriptionDeleted
} from '../services/billing.service'
import { EStatusCodes } from '../utils/status-codes'
import { unixTimestampToDate } from '../utils/time'

export const processBillingWebhookHandler = async (req: IBillingRequest, res: Response): Promise<void> => {
	if (!req.billingEvent) {
		throw new Error('req.billingEvent is missing in processBillingWebhookHandler')
	}

	const { billingEvent } = req

	switch (billingEvent.type) {
		case 'invoice.paid': {
			const paidInvoice = billingEvent.data.object
			const lineItems = paidInvoice.lines.data

			console.log('[WEBHOOK] ========== invoice.paid received ==========')
			console.log('[WEBHOOK] Customer email:', paidInvoice.customer_email)

			if (lineItems[0]) {
				const subscription = paidInvoice.parent?.subscription_details?.subscription
				const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id

				if (!subscriptionId) {
					throw new Error('Subscription missing from invoice')
				}

				const externalPriceId = lineItems[0].pricing?.price_details?.price

				if (!externalPriceId) {
					throw new Error('Price ID missing from invoice line item')
				}

				const product = await getProductByExternalPriceId({ priceId: externalPriceId as string })

				if (!product) {
					throw new Error(`Product with external price ID "${externalPriceId}" not found`)
				}

				const unixTimestampExpiresAt = lineItems[0].period.end

				if (!unixTimestampExpiresAt) {
					throw new Error('Period end missing from invoice line item')
				}

				console.log('[WEBHOOK] Extracted data:', {
					subscriptionId,
					productId: product.id,
					productName: product.name,
					expiresAtUnix: unixTimestampExpiresAt,
					expiresAtDate: new Date(unixTimestampExpiresAt * 1000).toISOString(),
					periodStart: new Date(lineItems[0].period.start * 1000).toISOString(),
					periodEnd: new Date(lineItems[0].period.end * 1000).toISOString()
				})

				await registerUserBilling({
					userEmail: paidInvoice.customer_email || '',
					productId: product.id,
					externalCustomerId: paidInvoice.customer as string,
					externalSubscriptionId: subscriptionId,
					expiresAt: unixTimestampExpiresAt
				})

				console.log('[WEBHOOK] ========== invoice.paid completed ==========')
			}
			break
		}

		case 'invoice.payment_failed': {
			const failedInvoice = billingEvent.data.object
			const subscription = failedInvoice.lines?.data?.[0]?.subscription

			const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id

			if (!subscriptionId) {
				throw new Error('Subscription missing from invoice line item')
			}

			/**
			 * Stripe webhooks return subscription as string ID by default (not expanded)
			 * but the type allows string | Subscription | null, so we handle both cases
			 */
			await updateBillingOnPaymentFailed(subscriptionId)
			break
		}

		case 'customer.subscription.updated': {
			const updatedSubscription = billingEvent.data.object

			const currentPeriodEnd = updatedSubscription.items.data[0]?.current_period_end

			if (!currentPeriodEnd) {
				throw new Error('Subscription item missing current_period_end')
			}

			const expiresAt = updatedSubscription.cancel_at ? unixTimestampToDate(updatedSubscription.cancel_at) : unixTimestampToDate(currentPeriodEnd)

			await updateBillingOnSubscriptionUpdated({
				externalSubscriptionId: updatedSubscription.id,
				status: updatedSubscription.status,
				currentPeriodEnd: expiresAt
			})

			break
		}

		case 'customer.subscription.deleted': {
			const deletedSubscription = billingEvent.data.object

			await updateBillingOnSubscriptionDeleted(deletedSubscription.id)
			break
		}
	}

	res.status(EStatusCodes.OK).json({ received: true })
}
