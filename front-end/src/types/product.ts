export interface IProduct {
    id: string
    name: string
    description: string
    priceInCents: number
    features?: string[]
}