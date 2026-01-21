export interface IBaseModel {
	// uuid
	id: string
	createdAt: Date
	updatedAt: Date | null
}

export default abstract class BaseModel<T> implements IBaseModel {
	id: string
	createdAt: Date
	updatedAt: Date | null

	constructor(data: IBaseModel) {
		this.id = data.id
		this.createdAt = data.createdAt
		this.updatedAt = data.updatedAt
	}

	abstract toDatabaseFormat(): unknown
	abstract toJSON(): T
}