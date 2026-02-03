import { z } from 'zod'

export const createCheckoutSessionSchema = z.object({
    priceId: z.string().min(1, 'Price ID is required'),
    successUrl: z.url('Success URL must be a valid URI'),
    cancelUrl: z.url('Cancel URL must be a valid URI')
})

export const createPortalSessionSchema = z.object({
    returnUrl: z.url('Return URL must be a valid URI')
})