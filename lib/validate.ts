/**
 * Validates a barcode string to ensure it follows standard retail barcode formats
 * EAN-8 (8 digits)
 * UPC-A (12 digits)
 * EAN-13 (13 digits)
 * GTIN-14 (14 digits)
 */
export function validateBarcode(barcode: string | null): boolean {
  if (!barcode) return false

  // Must be only digits
  if (!/^\d+$/.test(barcode)) {
    return false
  }

  const length = barcode.length
  
  // Valid lengths for standard retail barcodes
  if (length !== 8 && length !== 12 && length !== 13 && length !== 14) {
    return false
  }

  return true
}
