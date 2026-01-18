import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.routes'
import billingRoutes from './routes/billing.routes'
import { processBillingWebhookHandler } from './controllers/billing.controller'
import { verifyIfUserBillingHasExpiredMiddleware, verifyStripeWebhookSignatureMiddleware } from './middlewares/billing.middleware'
import { verifyUserTokenMiddleware } from './middlewares/jwt.middleware'

const app = express()

app.post('/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  verifyStripeWebhookSignatureMiddleware,
  processBillingWebhookHandler
)

app.options('*', cors())
app.use(cors())

// to parse incoming JSON data from requests
app.use(express.json())

// login route with returns a token which needs to be used in all the next routes below the login one
app.use('/auth', authRoutes)

// all the requests below needs a JWT 'authorization' headers key
// example: { headers: { authorization: Bearer token123 } }
app.use(
  verifyUserTokenMiddleware,
  verifyIfUserBillingHasExpiredMiddleware
)

app.use('/billing', billingRoutes)

export default app
