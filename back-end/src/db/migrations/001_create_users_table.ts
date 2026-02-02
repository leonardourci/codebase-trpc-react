import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
        table.string('email').notNullable().unique()
        table.string('full_name').notNullable()
        table.string('phone').notNullable()
        table.integer('age').notNullable()
        table.string('password_hash').notNullable()
        table.string('google_id').nullable().unique()
        table.text('refresh_token').nullable()
        table.boolean('email_verified').notNullable().defaultTo(false)
        table.text('email_verification_token').nullable()
        table.uuid('current_product_id').nullable()
        table.timestamps(true, true)
    })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('users')
}