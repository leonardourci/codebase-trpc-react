import { IBaseModel } from "./base"

export interface IProduct extends IBaseModel {
    name: string
    description: string
    priceInCents: number
    externalProductId: string | null
    externalPriceId: string | null
    active: boolean
}

export interface IProductDbRow {
    id: string
    name: string
    description: string
    price_in_cents: number
    external_product_id: string | null
    external_price_id: string | null
    active: boolean
    created_at: Date
    updated_at: Date | null
}