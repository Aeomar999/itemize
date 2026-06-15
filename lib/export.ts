import * as XLSX from 'xlsx'
import { IMDBRecord } from '@/types/imdb'

export function exportRecords(records: IMDBRecord[], format: "xlsx" | "csv") {
  // Only export "done" records
  const validRecords = records.filter(r => r.status === "done")
  
  if (validRecords.length === 0) return

  // Flatten the fields
  const data = validRecords.map(r => ({
    Barcode: r.fields.barcode.value || "",
    "Category Type": r.fields.categoryType.value || "",
    "Segment Type": r.fields.segmentType.value || "",
    Manufacturer: r.fields.manufacturer.value || "",
    Brand: r.fields.brand.value || "",
    "Product Name": r.fields.productName.value || "",
    "Weight & Unit": r.fields.weightAndUnit.value || "",
    "Packaging Type": r.fields.packagingType.value || "",
    "Country of Origin": r.fields.countryOfOrigin.value || "",
    "Promotional Messages": r.fields.promotionalMessages.value || "",
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "IMDB Data")

  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `itemize_export_${dateStr}.${format}`

  if (format === "csv") {
    XLSX.writeFile(workbook, filename, { bookType: "csv" })
  } else {
    XLSX.writeFile(workbook, filename, { bookType: "xlsx" })
  }
}
