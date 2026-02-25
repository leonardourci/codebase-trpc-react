import { BaseModel } from "./base"

export interface Product extends BaseModel {
    name: string
    description: string
    priceInCents: number
    externalProductId: string | null
    externalPriceId: string | null
    active: boolean
    isFreeTier: boolean
    maxProjects: number | null
}

export interface ProductDbRow {
    id: string
    name: string
    description: string
    price_in_cents: number
    external_product_id: string | null
    external_price_id: string | null
    active: boolean
    is_free_tier: boolean
    max_projects: number | null
    created_at: Date
    updated_at: Date | null
}