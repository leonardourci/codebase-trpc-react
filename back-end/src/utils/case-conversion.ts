export function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

export function toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function keysToSnakeCase<TInput extends Record<string, any>, TOutput = any>(obj: TInput): TOutput {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = toSnakeCase(key)
        result[snakeKey] = value
    }
    return result as TOutput
}

export function keysToCamelCase<TInput extends Record<string, any>, TOutput = any>(obj: TInput): TOutput {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = toCamelCase(key)
        result[camelKey] = value
    }
    return result as TOutput
}