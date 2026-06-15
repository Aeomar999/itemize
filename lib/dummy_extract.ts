import { IMDBRecord, FieldValue } from '@/types/imdb'

function createDummyField(value: string | null, confidence: number, isValid = true): FieldValue {
  return { value, confidence, isEdited: false, isValid }
}

export async function dummyExtract(id: string, file: File): Promise<Partial<IMDBRecord>> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Simulate random extraction data
  // We'll intentionally make some confidence low or invalid to test UI
  
  const isCoke = file.name.toLowerCase().includes('coke')

  if (isCoke) {
    return {
      status: "done",
      fields: {
        barcode: createDummyField("5449000000996", 0.99),
        categoryType: createDummyField("Beverages", 0.95),
        segmentType: createDummyField("Carbonated Soft Drinks", 0.90),
        manufacturer: createDummyField("The Coca-Cola Company", 0.95),
        brand: createDummyField("Coca-Cola", 0.98),
        productName: createDummyField("Coca-Cola Original Taste", 0.92),
        weightAndUnit: createDummyField("330 mL", 0.95),
        packagingType: createDummyField("Can", 0.99),
        countryOfOrigin: createDummyField("United States", 0.45), // Low confidence to trigger review
        promotionalMessages: createDummyField("Share a Coke", 0.70)
      }
    }
  }

  return {
    status: "done",
    fields: {
      barcode: createDummyField(Math.floor(1000000000000 + Math.random() * 9000000000000).toString(), 0.99),
      categoryType: createDummyField("Snacks", 0.85),
      segmentType: createDummyField("Chips", 0.80),
      manufacturer: createDummyField("Frito-Lay", 0.90),
      brand: createDummyField("Lay's", 0.95),
      productName: createDummyField("Classic Potato Chips", 0.95),
      weightAndUnit: createDummyField("150 g", 0.95),
      packagingType: createDummyField("Bag", 0.99),
      countryOfOrigin: createDummyField("United Kingdom", 0.95),
      promotionalMessages: createDummyField(null, 0.90) // Null example
    }
  }
}
