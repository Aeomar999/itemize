/**
 * Validates a barcode string (EAN-8, EAN-13, UPC-A, GTIN-14)
 */
export function validateBarcode(barcode: string | null): boolean {
  if (!barcode) return false
  const digits = barcode.replace(/\D/g, "")

  // Check length
  if (![8, 12, 13, 14].includes(digits.length)) return false

  // Validate GTIN check digit using standard algorithm
  let sum = 0
  for (let i = 0; i < digits.length - 1; i++) {
    const digit = parseInt(digits[i], 10)
    // Alternate between multiplying by 3 and 1 (right to left)
    const multiplier = (digits.length - i - 1) % 2 === 0 ? 3 : 1
    sum += digit * multiplier
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10
  const providedCheckDigit = parseInt(digits[digits.length - 1], 10)

  return calculatedCheckDigit === providedCheckDigit
}
