export interface FieldValue {
  value: string | null
  confidence: number        // 0.0 – 1.0
  isEdited: boolean
  isValid: boolean
}

export interface MediaItem {
  url: string
  name: string
  type: string // "image" or "video"
}

export interface IMDBRecord {
  id: string
  media: MediaItem[]        // supports multiple images or videos

  status: "queued" | "processing" | "done" | "error"
  fields: {
    barcode:             FieldValue
    categoryType:        FieldValue
    segmentType:         FieldValue
    manufacturer:        FieldValue
    brand:               FieldValue
    productName:         FieldValue
    weightAndUnit:       FieldValue
    packagingType:       FieldValue
    countryOfOrigin:     FieldValue
    promotionalMessages: FieldValue
  }
  needsReview: boolean
  duplicateFlag: "none" | "exact" | "possible"
  duplicateOf: string | null
  error: string | null
}

export type IMDBFieldKey = keyof IMDBRecord["fields"]

export interface GeminiFieldResult {
  value: string | null
  confidence: number
}

export interface NormalizedFields {
  barcode: GeminiFieldResult
  categoryType: GeminiFieldResult
  segmentType: GeminiFieldResult
  manufacturer: GeminiFieldResult
  brand: GeminiFieldResult
  productName: GeminiFieldResult
  weightAndUnit: GeminiFieldResult
  packagingType: GeminiFieldResult
  countryOfOrigin: GeminiFieldResult
  promotionalMessages: GeminiFieldResult
}

export interface ValidatedFieldResult extends GeminiFieldResult {
  isValid: boolean
  source: "gemini" | "zxing" | "override"
}

export interface ValidatedFields {
  barcode: ValidatedFieldResult
  categoryType: ValidatedFieldResult
  segmentType: ValidatedFieldResult
  manufacturer: ValidatedFieldResult
  brand: ValidatedFieldResult
  productName: ValidatedFieldResult
  weightAndUnit: ValidatedFieldResult
  packagingType: ValidatedFieldResult
  countryOfOrigin: ValidatedFieldResult
  promotionalMessages: ValidatedFieldResult
}
