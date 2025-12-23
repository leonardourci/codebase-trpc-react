import Stripe from 'stripe'
import globalConfig from './globalConfig'

const stripe = new Stripe(globalConfig.stripeSecretKey, { typescript: true })

export default stripe
