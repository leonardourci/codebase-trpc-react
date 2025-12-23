export interface IBaseModel {
	// uuid
	id: string
	createdAt?: Date
	updatedAt?: Date
}

export default abstract class BaseModel<T> implements IBaseModel {
	id: string
	createdAt?: Date
	updatedAt?: Date

	constructor() {
		const now = new Date()

		this.id = crypto.randomUUID()
		this.createdAt = now
		this.updatedAt = now
	}

	abstract toDatabaseFormat(): unknown
	abstract toJSON(): T
}
