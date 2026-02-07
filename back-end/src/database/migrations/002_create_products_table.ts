import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('products', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('name').notNullable()
        table.text('description').notNullable()
        table.integer('price_in_cents').notNullable()
        table.string('external_product_id').nullable()
        table.string('external_price_id').nullable()
        table.boolean('active').defaultTo(true)
        table.boolean('is_free_tier').notNullable().defaultTo(false)
        table.integer('max_projects').nullable()
        table.timestamps(true, true)
    })

    // Create partial unique index for free tier - ensures only one product can be marked as free tier
    await knex.raw(`
        CREATE UNIQUE INDEX idx_products_single_free_tier
        ON products (is_free_tier)
        WHERE is_free_tier = true
    `)
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('DROP INDEX IF EXISTS idx_products_single_free_tier')
    await knex.schema.dropTable('products')
}