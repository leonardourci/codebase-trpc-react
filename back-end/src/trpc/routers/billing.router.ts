import { TRPCError } from '@trpc/server'
import { router } from '../trpc'
import { protectedProcedure, verifiedEmailProcedure } from '../middleware/auth.middleware'
import { createCheckoutSessionSchema, createPortalSessionSchema } from '../../utils/validations/billing.schemas'
import { getProductById } from '../../database/repositories/product.repository'
import { getBillingByUserId } from '../../database/repositories/billing.repository'
import stripe from '../../utils/stripe'

export const billingRouter = router({
    getUserBilling: protectedProcedure
        .query(async ({ ctx }) => {
            const billing = await getBillingByUserId({ userId: ctx.user.id })

            if (!billing) {
                return {
                    hasSubscription: false,
                    billing: null,
                    product: null
                }
            }

            const product = await getProductById({ id: billing.productId })

            return {
                hasSubscription: true,
                billing,
                product
            }
        }),

    createCheckoutSession: verifiedEmailProcedure
        .input(createCheckoutSessionSchema)
        .mutation(async ({ input, ctx }) => {
            const product = await getProductById({ id: input.productId })
            if (!product) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Product not found'
                })
            }

            const session = await stripe.checkout.sessions.create({
                mode: 'subscription',
                customer_email: ctx.user.email,
                line_items: [{ price: product.externalPriceId, quantity: 1 }],
                success_url: input.successUrl,
                cancel_url: input.cancelUrl,
                metadata: { productId: product.id },
                allow_promotion_codes: true
            })

            if (!session.url) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Checkout URL not available'
                })
            }

            return { id: session.id, url: session.url }
        }),

    createCustomerPortalSession: verifiedEmailProcedure
        .input(createPortalSessionSchema)
        .mutation(async ({ input, ctx }) => {
            const billing = await getBillingByUserId({ userId: ctx.user!.id })

            if (!billing) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'User billing not found'
                })
            }

            if (!billing.externalCustomerId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Stripe customer not found'
                })
            }

            const portal = await stripe.billingPortal.sessions.create({
                customer: billing.externalCustomerId,
                return_url: input.returnUrl
            })

            return { url: portal.url }
        })
})