import { IBilling } from '../../types/billing'
import BaseModel from './Base.model'

export default class Billing extends BaseModel<IBilling> implements IBilling {
	static tableName = 'billings'

	userId: string
	productId: string
	stripePaymentIntentId: string
	stripeSubscriptionId: string
	stripeCustomerId: string
	status: string
	expiresAt: Date

	constructor(data: IBilling) {
		super()
		this.userId = data.userId
		this.productId = data.productId
		this.stripePaymentIntentId = data.stripePaymentIntentId
		this.stripeSubscriptionId = data.stripeSubscriptionId
		this.stripeCustomerId = data.stripeCustomerId
		this.status = data.status
		this.expiresAt = data.expiresAt
	}

	toJSON(): IBilling {
		return new Billing({
			id: this.id,
			userId: this.userId,
			productId: this.productId,
			stripePaymentIntentId: this.stripePaymentIntentId,
			stripeSubscriptionId: this.stripeSubscriptionId,
			stripeCustomerId: this.stripeCustomerId,
			status: this.status,
			expiresAt: this.expiresAt,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		})
	}

	toDatabaseFormat() {
		return {
			id: this.id,
			user_id: this.userId,
			product_id: this.productId,
			stripe_payment_intent_id: this.stripePaymentIntentId,
			stripe_subscription_id: this.stripeSubscriptionId,
			stripe_customer_id: this.stripeCustomerId,
			status: this.status,
			expires_at: this.expiresAt,
			created_at: this.createdAt,
			updated_at: this.updatedAt
		}
	}
}
