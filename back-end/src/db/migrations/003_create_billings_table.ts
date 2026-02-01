import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('billings', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
        table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE')
        table.string('external_payment_intent_id').notNullable()
        table.string('external_subscription_id').notNullable()
        table.string('external_customer_id').notNullable()
        table.string('status').notNullable()
        table.timestamp('expires_at').notNullable()
        table.timestamps(true, true)
    })

    // Add current_product_id to users table
    await knex.schema.alterTable('users', (table) => {
        table.uuid('current_product_id').nullable().references('id').inTable('products').onDelete('SET NULL')
    })
}

export async function down(knex: Knex): Promise<void> {
    // Remove current_product_id from users table
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('current_product_id')
    })

    await knex.schema.dropTable('billings')
}