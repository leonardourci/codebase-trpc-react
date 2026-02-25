import { Response } from 'express'

import { BillingRequest } from '../middlewares/billing.middleware'
import { getProductByExternalProductId } from '../database/repositories/product.repository'
import { registerUserBilling, updateBillingOnPaymentFailed, updateBillingOnSubscriptionUpdated, updateBillingOnSubscriptionDeleted } from '../services/billing.service'
import { StatusCodes } from '../utils/status-codes'
import { unixTimestampToDate } from '../utils/time'

export const processBillingWebhookHandler = async (req: BillingRequest, res: Response): Promise<void> => {
	if (!req.billingEvent) {
		throw new Error('req.billingEvent is missing in processBillingWebhookHandler')
	}

	const { billingEvent } = req

	switch (billingEvent.type) {
		case 'invoice.paid': {
			const paidInvoice = billingEvent.data.object
			const lineItems = paidInvoice.lines.data
			if (lineItems[0]) {
				const externalProductId = lineItems[0].pricing?.price_details?.product
				const product = await getProductByExternalProductId({ id: externalProductId ?? '' })

				if (!product) {
					throw new Error(`Product with external ID "${externalProductId}" not found`)
				}

				const subscription = lineItems[0].subscription
				const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id

				if (!subscriptionId) {
					throw new Error('Subscription missing from invoice line item')
				}

				await registerUserBilling({
					userEmail: paidInvoice.customer_email || '',
					productId: product.id,
					externalCustomerId: paidInvoice.customer as string,
					externalSubscriptionId: subscriptionId,
					expiresAt: lineItems[0].period.end,
				})
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

			const expiresAt = updatedSubscription.cancel_at
				? unixTimestampToDate(updatedSubscription.cancel_at)
				: unixTimestampToDate(currentPeriodEnd)

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
	res.status(StatusCodes.OK).send('Webhook processed successfully')
}
