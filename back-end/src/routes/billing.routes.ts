import express from 'express'

import { performJson } from '../adapters/expressAdapter'
import { createCheckoutSessionHandler, createCustomerPortalSessionHandler } from '../controllers/billing.controller'
const router = express.Router()

// Exemplo de rota de billing
// router.post('/charge', performJson(chargeHandler))

router.post('/checkout/sessions', performJson(createCheckoutSessionHandler))
router.post('/portal/sessions', performJson(createCustomerPortalSessionHandler))

export default router
