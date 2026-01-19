import { ISignupResponse } from '../../types/auth'
import { ICreateUserPayload, IUser, IUserInfoByEmailResponse } from '../../types/user'
import BaseModel from './Base.model'

export class User extends BaseModel<IUser> implements IUser {
	static tableName = 'users'

	email: string
	fullName: string
	phone: string
	age: number
	passwordHash: string

	constructor(props: ICreateUserPayload) {
		super()
		this.email = props.email
		this.fullName = props.fullName
		this.phone = props.phone
		this.age = props.age
		this.passwordHash = props.passwordHash
	}

	toJSON() {
		return new User({
			email: this.email,
			fullName: this.fullName,
			phone: this.phone,
			age: this.age,
			passwordHash: this.passwordHash,
		})
	}

	toDatabaseFormat() {
		return {
			id: this.id,
			email: this.email,
			full_name: this.fullName,
			phone: this.phone,
			age: this.age,
			password_hash: this.passwordHash,
			created_at: this.createdAt,
			updated_at: this.updatedAt
		}
	}

	toUserWithoutPassword(): Omit<IUser, 'password'> {
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
			passwordHash: this.passwordHash
		}
	}
}
