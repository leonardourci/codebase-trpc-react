import { Response } from 'express'

import { BillingRequest } from '../middlewares/billing.middleware'
import { getProductByExternalProductId } from '../database/repositories/product.repository'
import { registerUserBilling } from '../services/billing.service'
import { EStatusCodes } from '../utils/statusCodes'

/**
 * Resposta do deepseek pros eventos que preciso escutar:
 *
 * https://chat.deepseek.com/a/chat/s/86a7ffd7-7371-484f-a96f-85cc116f71e9
 */

export const processBillingWebhookHandler = async (req: BillingRequest, res: Response): Promise<void> => {
	if (!req.billingEvent) {
		throw new Error('req.billingEvent is missing in processBillingWebhookHandler')
	}

	const { billingEvent } = req
	switch (billingEvent.type) {
		// ============================================================================
		// WEBHOOK DE ASSINATURAS STRIPE - PRINCIPAIS EVENTOS
		// ============================================================================
		// Este endpoint recebe e processa eventos do Stripe para gerenciar o ciclo de vida das assinaturas.
		// IMPORTANTE: Sempre verifique a assinatura do webhook (stripe-signature) para garantir segurança.

		/**
		 * EVENTO: `invoice.paid`
		 * PORQUÊ ESCUTAR: É o principal indicador de que um pagamento foi concluído com sucesso.
		 * Este evento é disparado quando:
		 * 1. O pagamento automático recorrente é processado;
		 * 2. O usuário paga uma fatura manualmente (ex: após uma falha);
		 * 3. O usuário faz o primeiro pagamento de uma nova assinatura.
		 * É MAIS CONFIÁVEL do que confiar apenas no status da subscription, pois garante que o dinheiro foi recebido.
		 *
		 * COMO/ O QUE FAZER:
		 * 1. Conceder ou renovar acesso ao serviço para o cliente.
		 * 2. Atualizar o status do usuário em seu banco de dados para "ativo" ou similar.
		 * 3. (Opcional) Enviar um e-mail de confirmação de pagamento/recebimento.
		 *
		 * PONTOS DE ATENÇÃO:
		 * - O evento `invoice.paid` PODE SER RECEBIDO ANTES do `customer.subscription.updated`.
		 * - A fatura (`invoice`) pode ter o status `paid`, mas a assinatura (`subscription`) ainda pode estar
		 *   `incomplete` se for o primeiro pagamento. Use o ID da assinatura do objeto para buscar seu status mais recente.
		 */
		case 'invoice.paid': {
			const paidInvoice = billingEvent.data.object
			const lineItems = paidInvoice.lines.data
			if (lineItems[0]) {
				const externalProductId = lineItems[0].pricing?.price_details?.product
				const product = await getProductByExternalProductId({ id: externalProductId ?? '' })

				if (!product) {
					throw new Error(`Product with external ID "${externalProductId}" not found`)
				}

				console.log({
					userEmail: paidInvoice.customer_email,
					productId: product.id,
					stripeCustomerId: paidInvoice.customer,
					stripeSubscriptionId: lineItems[0].subscription,
					expiresAt: lineItems[0].period.end
				})

				await registerUserBilling({
					userEmail: paidInvoice.customer_email || '',
					productId: product.id,
					stripeCustomerId: paidInvoice.customer as string,
					stripeSubscriptionId: lineItems[0].subscription as string,
					expiresAt: lineItems[0].period.end,

					// still need to figure out how to get the payment intent id from the invoice object
					stripePaymentIntent: 'something'
				})
				// await sendBillingConfirmationMessage({})
			}

			res.status(EStatusCodes.OK).send('Webhook processed successfully')
			break
		}

		/**
		 * EVENTO: `invoice.payment_failed`
		 * PORQUÊ ESCUTAR: Indica que uma tentativa de pagamento automático FALHOU.
		 * Este é o evento fundamental para lidar com falhas de pagamento recorrentes ou iniciais.
		 *
		 * COMO/ O QUE FAZER:
		 * 1. Notificar imediatamente o usuário (e-mail, notificação no app) sobre a falha.
		 * 2. Instruí-lo a atualizar seu método de pagamento no Customer Portal.
		 * 3. NO PRIMEIRO PAGAMENTO: Não conceder acesso ao serviço, pois a assinatura ficará "incomplete".
		 * 4. NO PAGAMENTO RECORRENTE: Você pode optar por:
		 *    - Manter o acesso por um período de cortesia (se a assinatura estiver `past_due`).
		 *    - Restringir o acesso imediatamente (depende da sua política).
		 *
		 * PONTOS DE ATENÇÃO:
		 * - O Stripe tentará recolher o pagamento AUTOMATICAMENTE nos dias seguintes (processo de "dunning").
		 * - Se após várias tentativas o pagamento não for feito, a assinatura será cancelada (`subscription.deleted`).
		 * - Verifique `paid_out_of_band` no objeto invoice. Se for `true`, o pagamento foi feito externamente
		 *   (ex: boleto pago em bancos) e você NÃO deve restringir o acesso.
		 */
		case 'invoice.payment_failed': {
			const failedInvoice = event.data.object
			// Exemplo: notificar o usuário sobre a falha
			await notifyUserOfBillingFailure(failedInvoice.customer, failedInvoice.id)
			break
		}

		/**
		 * EVENTO: `customer.subscription.updated`
		 * PORQUÊ ESCUTAR: Para capturar QUALQUER alteração na assinatura, incluindo:
		 * 1. Cancelamento solicitado pelo cliente (via Customer Portal).
		 * 2. Troca de plano (upgrade/downgrade).
		 * 3. Renovação após um pagamento bem-sucedido que mudou o status de `past_due` para `active`.
		 * 4. Aplicação de cupons.
		 *
		 * COMO/ O QUE FAZER:
		 * 1. SEMPRE verifique a flag `cancel_at_period_end`:
		 *    - Se for `true`: o cliente cancelou para o fim do período. Agende a revogação de acesso para `current_period_end`.
		 *    - Se for `false`: o cliente removeu um cancelamento agendado. Restaure o acesso normalmente.
		 * 2. Verifique se houve mudança de plano (`items.data[0].price.id`) e atualize os recursos do usuário.
		 * 3. Sincronize o novo status (`active`, `past_due`, etc.) e datas (`current_period_end`) em seu banco de dados.
		 *
		 * PONTOS DE ATENÇÃO:
		 * - Este evento é disparado MUITAS VEZES. Sua lógica deve ser idempotente (tolerante a processamentos duplicados).
		 * - Para cancelamentos, NÃO revogue o acesso imediatamente. O cliente tem direito ao serviço até o fim do período já pago.
		 */
		case 'customer.subscription.updated':
			const updatedSubscription = event.data.object
			// Exemplo: tratar cancelamento agendado
			if (updatedSubscription.cancel_at_period_end) {
				await scheduleCancellation(updatedSubscription.id, updatedSubscription.current_period_end)
			} else {
				// Tratar outras mudanças (plano, status)
				await syncSubscriptionDetails(updatedSubscription)
			}
			break

		/**
		 * EVENTO: `customer.subscription.deleted`
		 * PORQUÊ ESCUTAR: Para saber quando uma assinatura foi CANCELADA IMEDIATAMENTE OU ENCERRADA DEFINITIVAMENTE.
		 * Ocorre quando:
		 * 1. O cliente cancela e solicita reembolso (cancelamento imediato).
		 * 2. O Stripe cancela automaticamente após várias tentativas de pagamento falhadas.
		 * 3. Você cancela via API.
		 *
		 * COMO/ O QUE FAZER:
		 * 1. REVOGAR imediatamente o acesso do usuário ao serviço.
		 * 2. Atualizar o status em seu banco de dados para "cancelado".
		 * 3. (Opcional) Enviar um e-mail de confirmação de cancelamento.
		 *
		 * PONTOS DE ATENÇÃO:
		 * - Diferente do cancelamento agendado (`cancel_at_period_end`), aqui o acesso deve ser CORTADO IMEDIATAMENTE.
		 * - Verifique a propriedade `deleted` do objeto. Ela será `true`.
		 */
		case 'customer.subscription.deleted':
			const deletedSubscription = event.data.object
			// Exemplo: revogar acesso imediato
			await immediatelyRevokeAccess(deletedSubscription.customer)
			break
	}
}
