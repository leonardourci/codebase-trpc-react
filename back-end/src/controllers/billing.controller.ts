import { Response } from 'express'

import { IBillingRequest } from '../middlewares/billing.middleware'
import { getProductByExternalProductId } from '../database/repositories/product.repository'
import { registerUserBilling, updateBillingOnPaymentFailed, updateBillingOnSubscriptionUpdated, updateBillingOnSubscriptionDeleted } from '../services/billing.service'
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
			if (lineItems[0]) {
				const externalProductId = lineItems[0].pricing?.price_details?.product
				const product = await getProductByExternalProductId({ id: externalProductId ?? '' })

				if (!product) {
					throw new Error(`Product with external ID "${externalProductId}" not found`)
				}

				console.log({
					userEmail: paidInvoice.customer_email,
					productId: product.id,
					stripeCustomerId: paidInvoice.customer,
					stripeSubscriptionId: lineItems[0].subscription,
					expiresAt: lineItems[0].period.end
				})

				await registerUserBilling({
					userEmail: paidInvoice.customer_email || '',
					productId: product.id,
					externalCustomerId: paidInvoice.customer as string,
					externalSubscriptionId: lineItems[0].subscription as string,
					expiresAt: lineItems[0].period.end,

					externalPaymentIntentId: paidInvoice.id
				})
			}
			break
		}

		case 'invoice.payment_failed': {
			const failedInvoice = billingEvent.data.object
			console.log('invoice.payment_failed', {
				customer: failedInvoice.customer,
				invoiceId: failedInvoice.id,
				status: failedInvoice.status
			})
			const subscriptionId = failedInvoice.lines?.data?.[0]?.subscription
			await updateBillingOnPaymentFailed(String(subscriptionId || ''))
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

			console.log('customer.subscription.updated', {
				subscriptionId: updatedSubscription.id,
				status: updatedSubscription.status,
				cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
			})

			break
		}

		case 'customer.subscription.deleted': {
			const deletedSubscription = billingEvent.data.object
			console.log('customer.subscription.deleted', {
				subscriptionId: deletedSubscription.id,
				customer: deletedSubscription.customer
			})
			await updateBillingOnSubscriptionDeleted(deletedSubscription.id)
			break
		}
	}
	res.status(EStatusCodes.OK).send('Webhook processed successfully')
}
