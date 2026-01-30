import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import * as trpcExpress from '@trpc/server/adapters/express'

import { processBillingWebhookHandler } from './controllers/billing.controller'
import { verifyStripeWebhookSignatureMiddleware } from './middlewares/billing.middleware'
import { appRouter, createTRPCContext } from './trpc'
import globalConfig from './utils/global-config'

const app = express()

app.use(helmet())

// Stripe webhook route must be registered before rate limiter and body parsers
// It needs the raw body for signature verification and shouldn't be rate limited
app.post('/webhooks/stripe',
  express.raw({ type: 'application/json', limit: '1mb' }),
  verifyStripeWebhookSignatureMiddleware,
  processBillingWebhookHandler
)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

app.use(cors({
  origin: globalConfig.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

app.use(express.json({ limit: '10mb' }))

// Mount tRPC on /trpc route
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
)

export default app
