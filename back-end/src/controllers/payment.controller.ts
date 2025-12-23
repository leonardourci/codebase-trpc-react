import { RequestHandler } from "express";

/**
 * Resposta do deepseek pros eventos que preciso escutar:
 * 
 * // In your Stripe Dashboard webhook settings, listen for:
const REQUIRED_WEBHOOKS = [
  'customer.subscription.created',     // New subscription
  'customer.subscription.updated',     // Plan change, quantity change ---- acho que nao precisa
  'customer.subscription.deleted',     // Cancellation -- precisa
  'invoice.paid',                      // Successful payment -- precisa
  'invoice.payment_failed',            // Payment failed
  'invoice.payment_action_required'    // Requires user action (3D Secure)
];  
 */

export const processPaymentWebhook = (req, res) => {

}
