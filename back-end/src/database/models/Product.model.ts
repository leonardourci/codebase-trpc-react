import BaseModel, { IBaseModel } from './Base.model'

export interface IProduct extends IBaseModel {
	name: string
	description: string
	priceInCents: number
	currency: string
	type: string
	externalProductId: string
	externalPriceId: string
	active: boolean
}

export default class Product extends BaseModel<IProduct> implements IProduct {
	static tableName = 'products'

	name: string
	description: string
	priceInCents: number
	currency: string
	type: string
	externalProductId: string
	externalPriceId: string
	active: boolean

	constructor(data: {
		id: string
		name: string
		description: string
		priceInCents: number
		currency: string
		type: string
		externalProductId: string
		externalPriceId: string
		active: boolean
		createdAt: Date
		updatedAt: Date | null
	}) {
		super({ id: data.id, createdAt: data.createdAt, updatedAt: data.updatedAt })
		this.name = data.name
		this.description = data.description
		this.priceInCents = data.priceInCents
		this.currency = data.currency
		this.type = data.type
		this.externalProductId = data.externalProductId
		this.externalPriceId = data.externalPriceId
		this.active = data.active
	}

	toJSON(): IProduct {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			priceInCents: this.priceInCents,
			currency: this.currency,
			type: this.type,
			externalProductId: this.externalProductId,
			externalPriceId: this.externalPriceId,
			active: this.active,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		}
	}

	toDatabaseFormat() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			price_in_cents: this.priceInCents,
			currency: this.currency,
			type: this.type,
			external_product_id: this.externalProductId,
			external_price_id: this.externalPriceId,
			active: this.active,
			created_at: this.createdAt,
			updated_at: this.updatedAt
		}
	}
}