import { Knex } from 'knex'

import { PRICING_PLANS } from '@shared/config/pricing.config'
import { keysToSnakeCase } from '../../utils/case-conversion'

export async function seed(knex: Knex): Promise<void> {
	await knex('products').del()

	const dbRecords = PRICING_PLANS.map((plan) =>
		keysToSnakeCase({
			name: plan.name,
			description: plan.description,
			priceInCents: plan.priceInCents,
			externalProductId: plan.externalProductId,
			externalPriceId: plan.externalPriceId,
			active: plan.active,
			isFreeTier: plan.isFreeTier,
			maxProjects: plan.maxProjects
		})
	)

	await knex('products').insert(dbRecords)
}
