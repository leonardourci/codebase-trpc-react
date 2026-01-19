import { IBilling, ICreateBilling } from '../../types/billing'
import BaseModel from './Base.model'

export default class Billing extends BaseModel<IBilling> implements IBilling {
	static tableName = 'billings'

	userId: string
	productId: string
	externalPaymentIntentId: string
	externalSubscriptionId: string
	externalCustomerId: string
	status: string
	expiresAt: Date

	constructor(data: ICreateBilling) {
		super()
		this.userId = data.userId
		this.productId = data.productId
		this.externalPaymentIntentId = data.externalPaymentIntentId
		this.externalSubscriptionId = data.externalSubscriptionId
		this.externalCustomerId = data.externalCustomerId
		this.status = data.status
		this.expiresAt = data.expiresAt
	}

	toJSON(): IBilling {
		return new Billing({
			userId: this.userId,
			productId: this.productId,
			externalPaymentIntentId: this.externalPaymentIntentId,
			externalSubscriptionId: this.externalSubscriptionId,
			externalCustomerId: this.externalCustomerId,
			status: this.status,
			expiresAt: this.expiresAt,
		})
	}

	toDatabaseFormat() {
		return {
			id: this.id,
			user_id: this.userId,
			product_id: this.productId,
			external_payment_intent_id: this.externalPaymentIntentId,
			external_subscription_id: this.externalSubscriptionId,
			external_customer_id: this.externalCustomerId,
			status: this.status,
			expires_at: this.expiresAt,
			created_at: this.createdAt,
			updated_at: this.updatedAt
		}
	}
}
