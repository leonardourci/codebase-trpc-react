export interface IProduct {
    id: string
    name: string
    description: string
    priceInCents: number
    externalProductId: string
    externalPriceId: string
    active: boolean
    createdAt: string
    updatedAt?: string | null
    features?: string[]
}