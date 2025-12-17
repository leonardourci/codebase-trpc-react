export interface ILoginPayload {
	email: string
	password: string
}

export interface ILoginResponse {
	token: string
}

export interface ISignupPayload {
	fullName: string
	email: string
	password: string
	age: number
	phone: string
}

export interface ISignupResponse extends Omit<ISignupPayload, 'password'> {
	id: number
}
