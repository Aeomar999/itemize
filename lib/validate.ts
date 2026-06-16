/**
 * Validates a barcode string (EAN-8, EAN-13, UPC-A, GTIN-14)
 */
export function validateBarcode(barcode: string | null): boolean {
  if (!barcode) return false
  const digits = barcode.replace(/\D/g, "")
  return [8, 12, 13, 14].includes(digits.length)
}
