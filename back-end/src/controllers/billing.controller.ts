import { Response } from 'express'

import { IBillingRequest } from '../middlewares/billing.middleware'
import { getProductByExternalPriceId } from '../database/repositories/product.repository'
import Logger from '../utils/logger'
import {
	registerUserBilling,
	updateBillingOnPaymentFailed,
	updateBillingOnSubscriptionUpdated,
	updateBillingOnSubscriptionDeleted
} from '../services/billing.service'
import { EStatusCodes } from '../utils/status-codes'
import { unixTimestampToDate } from '../utils/time'

const logger = new Logger({ source: 'BILLING-CONTROLLER' })

export const processBillingWebhookHandler = async (req: IBillingRequest, res: Response): Promise<void> => {
	if (!req.billingEvent) {
		throw new Error('req.billingEvent is missing in processBillingWebhookHandler')
	}

	const { billingEvent } = req

	switch (billingEvent.type) {
		case 'invoice.paid': {
			const paidInvoice = billingEvent.data.object
			const lineItems = paidInvoice.lines.data

			if (lineItems[0]) {
				const subscription = paidInvoice.parent?.subscription_details?.subscription
				const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id

				if (!subscriptionId) {
					throw new Error('invoice.paid: Subscription missing from invoice')
				}

				const externalPriceId = lineItems[0].pricing?.price_details?.price

				if (!externalPriceId) {
					throw new Error('invoice.paid: Price ID missing from invoice line item')
				}

				const product = await getProductByExternalPriceId({ priceId: externalPriceId as string })

				if (!product) {
					logger.error(`invoice.paid: Product with external price ID "${externalPriceId}" not found`)
					break
				}

				const unixTimestampExpiresAt = lineItems[0].period.end

				if (!unixTimestampExpiresAt) {
					throw new Error('invoice.paid: Period end missing from invoice line item')
				}

				await registerUserBilling({
					userEmail: paidInvoice.customer_email || '',
					productId: product.id,
					externalCustomerId: paidInvoice.customer as string,
					externalSubscriptionId: subscriptionId,
					expiresAt: unixTimestampExpiresAt
				})
			}
			break
		}

		case 'invoice.payment_failed': {
			const failedInvoice = billingEvent.data.object
			const subscription = failedInvoice.lines?.data?.[0]?.subscription

			const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id

			if (!subscriptionId) {
				throw new Error('invoice.payment_failed: Subscription missing from invoice line item')
			}

			await updateBillingOnPaymentFailed({ externalSubscriptionId: subscriptionId })
			break
		}

		case 'customer.subscription.updated': {
			const updatedSubscription = billingEvent.data.object

			const currentPeriodEnd = updatedSubscription.items.data[0]?.current_period_end

			if (!currentPeriodEnd) {
				throw new Error('subscription.updated: Subscription item missing current_period_end')
			}

			const expiresAt = updatedSubscription.cancel_at ? unixTimestampToDate(updatedSubscription.cancel_at) : unixTimestampToDate(currentPeriodEnd)

			const priceId = updatedSubscription.items.data[0]?.price?.id
			let productId: string | undefined

			if (priceId) {
				const product = await getProductByExternalPriceId({ priceId })
				if (product) {
					productId = product.id
				} else {
					logger.error(`subscription.updated: Product with external price ID "${priceId}" not found`)
				}
			}

			await updateBillingOnSubscriptionUpdated({
				externalSubscriptionId: updatedSubscription.id,
				productId,
				status: updatedSubscription.status,
				currentPeriodEnd: expiresAt
			})

			break
		}

		case 'customer.subscription.deleted': {
			const deletedSubscription = billingEvent.data.object

			await updateBillingOnSubscriptionDeleted({ externalSubscriptionId: deletedSubscription.id })
			break
		}
	}

	res.status(EStatusCodes.OK).json({ received: true })
}
