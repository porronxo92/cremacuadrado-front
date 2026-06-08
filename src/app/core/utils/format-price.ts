export function pricePerHundredGrams(priceCents: number, grams: number): number {
  return Math.round((priceCents / grams) * 100);
}
