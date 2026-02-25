import { z } from 'zod'
import { createCheckoutSessionSchema, createPortalSessionSchema } from '../utils/validations/billing.schemas'
import { BaseModel } from "./base"

export interface Billing extends BaseModel {
  userId: string
  productId: string
  externalSubscriptionId: string
  externalCustomerId: string
  status: string
  expiresAt: Date
}

export interface CreateBilling {
  userId: string
  productId: string
  externalSubscriptionId: string
  externalCustomerId: string
  status: string
  expiresAt: Date
}

export interface BillingDbRow {
  id: string
  user_id: string
  product_id: string
  external_subscription_id: string
  external_customer_id: string
  status: string
  expires_at: Date
  created_at: Date
  updated_at: Date | null
}

export interface UpdateUserBillingInput {
	userEmail: string
	productId: string
	externalCustomerId: string
	externalSubscriptionId: string
	expiresAt: number
}

export interface CreateCheckoutSessionResponse {
  id: string
  url: string
}

export interface CreatePortalSessionResponse {
  url: string
}

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>

export type CreatePortalSessionInput = z.infer<typeof createPortalSessionSchema>
