/**
 * Formats a price from cents to a dollar string with 2 decimal places
 * @param params - The parameters object
 * @param params.priceInCents - The price in cents (e.g., 4999 for $49.99)
 * @returns Formatted price string with 2 decimal places (e.g., "49.99")
 */
export function formatPrice({ priceInCents }: { priceInCents: number }): string {
  const priceInDollars = priceInCents / 100
  return priceInDollars.toFixed(2)
}

/**
 * Calculates the monthly equivalent price for a yearly plan
 * @param params - The parameters object
 * @param params.yearlyPriceInCents - The yearly price in cents
 * @returns Monthly equivalent price in cents (yearlyPriceInCents / 12)
 */
export function getMonthlyEquivalent({ yearlyPriceInCents }: { yearlyPriceInCents: number }): number {
  return yearlyPriceInCents / 12
}
