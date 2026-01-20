import { z } from 'zod'
import { createCheckoutSessionSchema, createPortalSessionSchema } from '../utils/validations/billing.schemas'
import { IBaseModel } from "../database/models/Base.model"

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

export interface ICreateCheckoutSessionResponse {
  id: string
  url: string
}

export interface ICreatePortalSessionResponse {
  url: string
}

export type TCreateCheckoutSessionPayload = z.infer<typeof createCheckoutSessionSchema>

export type TCreatePortalSessionPayload = z.infer<typeof createPortalSessionSchema>
