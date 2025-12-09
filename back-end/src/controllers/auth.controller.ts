import { JoiValidationError } from '../utils/errors'
import { EStatusCodes } from '../domain/statusCodes'
import { ILoginPayload, ILoginResponse, ISignupPayload } from '../interfaces/auth'
import { validateLoginPayload, validateSignupPayload } from '../utils/validations/auth.validator'
import { authenticateUser, registerUser } from '../domain/services/auth.service'
import { IPerformJsonCallback } from '../adapters/expressAdapter'

export async function loginHandler(payload: ILoginPayload): Promise<IPerformJsonCallback<ILoginResponse>> {
	const { value, error } = validateLoginPayload(payload)

	if (error) throw new JoiValidationError(error)

	return {
		response: await authenticateUser(value),
		status: EStatusCodes.OK
	}
}

export async function signupHandler(payload: ISignupPayload): Promise<IPerformJsonCallback<any>> {
	const { value, error } = validateSignupPayload(payload)

	if (error) throw new JoiValidationError(error)

	return {
		response: await registerUser(value),
		status: EStatusCodes.OK
	}
}
