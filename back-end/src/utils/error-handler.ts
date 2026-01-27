import { TRPCError } from '@trpc/server'
import { EStatusCodes } from './status-codes'

export class CustomError extends Error {
    constructor(
        message: string,
        public statusCode: EStatusCodes = EStatusCodes.INTERNAL_SERVER_ERROR,
        public code?: string
    ) {
        super(message)
        this.name = 'CustomError'
    }
}

export function transformErrorToTRPC(error: CustomError): TRPCError {
    // Map only the status codes we care about, with a fallback for unmapped ones
    const getErrorCode = (statusCode: EStatusCodes): TRPCError['code'] => {
        switch (statusCode) {
            case EStatusCodes.BAD_REQUEST:
            case EStatusCodes.NOT_ACCEPTABLE:
            case EStatusCodes.PRECONDITION_FAILED:
            case EStatusCodes.UNPROCESSABLE:
                return 'BAD_REQUEST'
            case EStatusCodes.UNAUTHORIZED:
                return 'UNAUTHORIZED'
            case EStatusCodes.FORBIDDEN:
                return 'FORBIDDEN'
            case EStatusCodes.NOT_FOUND:
                return 'NOT_FOUND'
            case EStatusCodes.CONFLICT:
                return 'CONFLICT'
            case EStatusCodes.INTERNAL_SERVER_ERROR:
            default:
                return 'INTERNAL_SERVER_ERROR'
        }
    }

    return new TRPCError({
        code: getErrorCode(error.statusCode),
        message: error.message,
    })
}
