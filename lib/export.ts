import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { IMDBRecord } from '@/types/imdb'

export async function exportRecords(records: IMDBRecord[], format: "xlsx" | "csv") {
  const validRecords = records.filter(r => r.status === "done")
  if (validRecords.length === 0) return

  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-')
  const timestamp = `${dateStr}_${timeStr}`
  
  const filename = `predictions_${timestamp}.${format}`

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Itemize'
  workbook.created = now

  const sheet = workbook.addWorksheet('IMDB Data', {
    views: [{ state: 'frozen', ySplit: 1 }] // freeze first row
  })

  // Define columns with headers and widths
  sheet.columns = [
    { header: 'ITEM NAME', key: 'itemName', width: 35 },
    { header: 'BARCODE', key: 'barcode', width: 15 },
    { header: 'MANUFACTURER', key: 'manufacturer', width: 25 },
    { header: 'BRAND', key: 'brand', width: 20 },
    { header: 'WEIGHT', key: 'weight', width: 12 },
    { header: 'PACKAGING TYPE', key: 'packagingType', width: 18 },
    { header: 'COUNTRY', key: 'country', width: 15 },
    { header: 'VARIANT', key: 'variant', width: 25 },
    { header: 'TYPE', key: 'type', width: 15 },
    { header: 'FRAGRANCE_FLAVOR', key: 'fragranceFlavor', width: 25 },
    { header: 'PROMOTION', key: 'promotion', width: 20 },
    { header: 'ADDONS', key: 'addons', width: 20 },
    { header: 'TAGLINE', key: 'tagline', width: 40 },
  ]

  // Add rows
  validRecords.forEach(r => {
    sheet.addRow({
      itemName: r.fields.itemName.value || "",
      barcode: r.fields.barcode.value || "",
      manufacturer: r.fields.manufacturer.value || "",
      brand: r.fields.brand.value || "",
      weight: r.fields.weight.value || "",
      packagingType: r.fields.packagingType.value || "",
      country: r.fields.country.value || "",
      variant: r.fields.variant.value || "",
      type: r.fields.type.value || "",
      fragranceFlavor: r.fields.fragranceFlavor.value || "",
      promotion: r.fields.promotion.value || "",
      addons: r.fields.addons.value || "",
      tagline: r.fields.tagline.value || "",
    })
  })

  // Format header row
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25
  
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // slate-800
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    }
  })

  // Format data cells
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // Skip header
    row.height = 20
    row.eachCell((cell) => {
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, // slate-200
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      }
      
      // Zebra striping
      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' } // slate-50
        }
      }
    })
  })

  if (format === "xlsx") {
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, filename)
  } else if (format === "csv") {
    const buffer = await workbook.csv.writeBuffer()
    const blob = new Blob([buffer as BlobPart], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, filename)
  }
}
