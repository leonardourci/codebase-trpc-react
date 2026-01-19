import { getUserByEmail } from '../database/repositories/user.repository'
import {
	createBilling,
	getBillingByUserId as getBillingByUserId,
	updateBillingByUserId
} from '../database/repositories/billing.repository'

export interface IUpdateUserBillingPayload {
	userEmail: string
	productId: string
	externalCustomerId: string
	externalSubscriptionId: string
	expiresAt: number
	externalPaymentIntentId: string
}

export const registerUserBilling = async (payload: IUpdateUserBillingPayload) => {
	const user = await getUserByEmail({ email: payload.userEmail })
	if (!user) {
		throw new Error(`User with email "${payload.userEmail}" not found`)
	}

	const billing = await getBillingByUserId({ userId: user.id })
	if (!billing) {
		await createBilling({
			userId: user.id,
			productId: payload.productId,
			externalPaymentIntentId: payload.externalPaymentIntentId,
			externalSubscriptionId: payload.externalSubscriptionId,
			externalCustomerId: payload.externalCustomerId,
			status: 'active',
			expiresAt: new Date(payload.expiresAt * 1000)
		})
	} else {
		await updateBillingByUserId({
			id: billing.id as string,
			expiresAt: new Date(payload.expiresAt * 1000)
		})
	}
}
