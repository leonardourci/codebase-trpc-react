import {
	createBilling,
	getBillingByUserId as getBillingByUserId,
	updateBillingByUserId
} from '../database/repositories/billing.repository'
import { getUserByEmail } from '../database/repositories/user.repository'

export interface IUpdateUserBillingPayload {
	userEmail: string
	productId: string
	stripeCustomerId: string
	stripeSubscriptionId: string
	expiresAt: number
	stripePaymentIntent: string
}

export const registerUserBilling = async (payload: IUpdateUserBillingPayload) => {
	const user = await getUserByEmail({ email: payload.userEmail })
	if (!user) {
		throw new Error(`User with email "${payload.userEmail}" not found`)
	}
	const billing = await getBillingByUserId({ userId: user.id })
	if (!billing) {
		await createBilling({
			user_id: user.id,
			product_id: payload.productId,
			stripe_payment_intent_id: payload.stripePaymentIntent,
			stripe_subscription_id: payload.stripeSubscriptionId,
			stripe_customer_id: payload.stripeCustomerId,
			status: 'active',
			expires_at: new Date(payload.expiresAt * 1000)
		})
	} else {
		await updateBillingByUserId({
			id: billing.id,
			expiresAt: new Date(payload.expiresAt * 1000)
		})
	}
}
