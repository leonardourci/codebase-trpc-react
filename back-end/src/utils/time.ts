// Used to convert Unix timestamps (seconds) to JavaScript timestamps (milliseconds)
export const MILLISECONDS_PER_SECOND = 1000
export const SECONDS_PER_MINUTE = 60
export const MINUTES_PER_QUARTER_HOUR = 15

/**
 * Converts a Unix timestamp (seconds since epoch) to a JavaScript Date object
 * @param unixTimestamp - Unix timestamp in seconds
 * @returns JavaScript Date object
 */
export function unixTimestampToDate(unixTimestamp: number): Date {
	return new Date(unixTimestamp * MILLISECONDS_PER_SECOND)
}
