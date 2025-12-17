import { ISignupResponse } from '../../types/auth'

export interface IUser {
	id: number
	email: string
	fullName: string
	phone: string
	age: number
	passwordHash?: string
	createdAt?: Date
	updatedAt?: Date
}

export interface IUserInfoByEmailResponse {
	id: number
	passwordHash: string
}

export class User implements IUser {
	id: number
	email: string
	fullName: string
	phone: string
	age: number
	passwordHash?: string
	createdAt?: Date
	updatedAt?: Date

	constructor(props: IUser) {
		this.id = props.id
		this.email = props.email
		this.fullName = props.fullName
		this.phone = props.phone
		this.age = props.age
		this.passwordHash = props.passwordHash
		this.createdAt = props.createdAt
		this.updatedAt = props.updatedAt
	}

	static tableName = 'users'

	static fromDb(row: any): User {
		return new User({
			id: row.id,
			email: row.email,
			fullName: row.full_name,
			phone: row.phone,
			age: row.age,
			passwordHash: row.password_hash,
			createdAt: row.created_at ? new Date(row.created_at) : undefined,
			updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
		})
	}

	toUserWithoutPassword(): Omit<IUser, 'passwordHash'> {
		return {
			id: this.id,
			email: this.email,
			fullName: this.fullName,
			phone: this.phone,
			age: this.age,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		}
	}

	toSignupResponse(): ISignupResponse {
		return {
			id: this.id,
			email: this.email,
			fullName: this.fullName,
			age: this.age,
			phone: this.phone
		}
	}

	toUserInfoByEmailResponse(): IUserInfoByEmailResponse {
		return {
			id: this.id,
			passwordHash: this.passwordHash || ''
		}
	}
}
