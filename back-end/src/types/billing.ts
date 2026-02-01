import { z } from 'zod'
import { createCheckoutSessionSchema, createPortalSessionSchema } from '../utils/validations/billing.schemas'
import { IBaseModel } from "./base"

export interface IBilling extends IBaseModel {
  userId: string
  productId: string
  externalPaymentIntentId: string
  externalSubscriptionId: string
  externalCustomerId: string
  status: string
  expiresAt: Date
}

export interface ICreateBilling {
  userId: string
  productId: string
  externalPaymentIntentId: string
  externalSubscriptionId: string
  externalCustomerId: string
  status: string
  expiresAt: Date
}

export interface IBillingDbRow {
  id: string
  user_id: string
  product_id: string
  external_payment_intent_id: string
  external_subscription_id: string
  external_customer_id: string
  status: string
  expires_at: Date
  created_at: Date
  updated_at: Date | null
}

export interface ICreateCheckoutSessionResponse {
  id: string
  url: string
}

export interface ICreatePortalSessionResponse {
  url: string
}

export type TCreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>

export type TCreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>
