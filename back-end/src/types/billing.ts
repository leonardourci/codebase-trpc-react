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

export interface ICreateCheckoutSessionPayload {
  productId: string
  successUrl: string
  cancelUrl: string
  token: string
}

export interface ICreateCheckoutSessionResponse {
  id: string
  url: string
}

export interface ICreatePortalSessionPayload {
  returnUrl: string
  token: string
}

export interface ICreatePortalSessionResponse {
  url: string
}
