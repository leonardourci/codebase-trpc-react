import Stripe from 'stripe'
import globalConfig from './global-config'

const stripe = new Stripe(globalConfig.stripeSecretKey, { typescript: true })

export default stripe
