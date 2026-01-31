import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('products', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name').notNullable()
        table.text('description').notNullable()
        table.integer('price_in_cents').notNullable()
        table.string('external_product_id').notNullable()
        table.string('external_price_id').notNullable()
        table.boolean('active').defaultTo(true)
        table.timestamps(true, true)
    })
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('products')
}