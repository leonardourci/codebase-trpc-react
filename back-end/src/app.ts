import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes'
import { verifyJwtTokenHandler } from './utils/jwt'
import { performJson } from './adapters/expressAdapter'
import { processPaymentWebhook } from './controllers/payment.controller'
import { verifyStripeWebhookSignature } from './middlewares/payment.middleware'

const app = express()

app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  verifyStripeWebhookSignature,
  processPaymentWebhook
)

app.options('*', cors())
app.use(cors())

// to parse incoming JSON data from requests
app.use(express.json())

// login route with returns a token which needs to be used in all the next routes below the login one
app.use('/auth', authRoutes)

// all the requests below needs a JWT 'authorization' headers key
// example: { headers: { authorization: Bearer token123 } }
app.use(performJson(verifyJwtTokenHandler))

export default app
