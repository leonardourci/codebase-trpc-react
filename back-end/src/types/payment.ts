import { IBaseModel } from "../database/models/Base.model"

export interface IPayment extends IBaseModel {
  userId: string
  productId: string
  stripePaymentIntentId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
  expiresAt: Date
}

export interface ICreatePayment {
  user_id: string
  product_id: string
  stripe_payment_intent_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: string
  expires_at: Date
}