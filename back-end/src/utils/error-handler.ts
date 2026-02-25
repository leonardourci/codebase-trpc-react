import { TRPCError } from '@trpc/server'
import { StatusCodes } from './status-codes'

export class CustomError extends Error {
    constructor(
        message: string,
        public statusCode: StatusCodes = StatusCodes.INTERNAL_SERVER_ERROR,
        public code?: string
    ) {
        super(message)
        this.name = 'CustomError'
    }
}

export function transformErrorToTRPC(error: CustomError): TRPCError {
    // Map only the status codes we care about, with a fallback for unmapped ones
    const getErrorCode = (statusCode: StatusCodes): TRPCError['code'] => {
        switch (statusCode) {
            case StatusCodes.BAD_REQUEST:
            case StatusCodes.NOT_ACCEPTABLE:
            case StatusCodes.PRECONDITION_FAILED:
            case StatusCodes.UNPROCESSABLE:
                return 'BAD_REQUEST'
            case StatusCodes.UNAUTHORIZED:
                return 'UNAUTHORIZED'
            case StatusCodes.FORBIDDEN:
                return 'FORBIDDEN'
            case StatusCodes.NOT_FOUND:
                return 'NOT_FOUND'
            case StatusCodes.CONFLICT:
                return 'CONFLICT'
            case StatusCodes.INTERNAL_SERVER_ERROR:
            default:
                return 'INTERNAL_SERVER_ERROR'
        }
    }

    return new TRPCError({
        code: getErrorCode(error.statusCode),
        message: error.message,
    })
}
