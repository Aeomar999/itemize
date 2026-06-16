import * as XLSX from 'xlsx'
import { IMDBRecord } from '@/types/imdb'

export function exportRecords(records: IMDBRecord[], format: "xlsx" | "csv") {
  const validRecords = records.filter(r => r.status === "done")
  if (validRecords.length === 0) return

  // Exact competition column names and order
  const data = validRecords.map(r => ({
    "ITEM_NAME":         r.fields.itemName.value        || "",
    "BARCODE":           r.fields.barcode.value         || "",
    "MANUFACTURER":      r.fields.manufacturer.value    || "",
    "BRAND":             r.fields.brand.value           || "",
    "WEIGHT":            r.fields.weight.value          || "",
    "PACKAGING TYPE":    r.fields.packagingType.value   || "",
    "COUNTRY":           r.fields.country.value         || "",
    "VARIANT":           r.fields.variant.value         || "",
    "TYPE":              r.fields.type.value            || "",
    "FRAGRANCE_FLAVOR":  r.fields.fragranceFlavor.value || "",
    "PROMOTION":         r.fields.promotion.value       || "",
    "ADDONS":            r.fields.addons.value          || "",
    "TAGLINE":           r.fields.tagline.value         || "",
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "IMDB Data")

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = format === "csv" ? `predictions_${dateStr}.csv` : `predictions_${dateStr}.xlsx`

  XLSX.writeFile(workbook, filename, { bookType: format === "csv" ? "csv" : "xlsx" })
}
