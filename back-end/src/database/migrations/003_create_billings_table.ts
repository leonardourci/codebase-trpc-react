import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('billings', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
		table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
		table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE')
		table.string('external_subscription_id').notNullable()
		table.string('external_customer_id').notNullable()
		table.string('status').notNullable()
		table.timestamp('expires_at').notNullable()
		table.timestamps(true, true)
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('billings')
}
