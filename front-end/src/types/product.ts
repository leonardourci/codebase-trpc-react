export interface IProduct {
    id: string
    name: string
    description: string
    priceInCents: number
    currency: string
    type: string
    externalProductId: string
    features?: string[]
    externalPriceId: string
    active: boolean
    createdAt: string
    updatedAt?: string | null
}