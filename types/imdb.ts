export interface FieldValue {
  value: string | null
  confidence: number
  isEdited: boolean
  isValid: boolean
  source?: string
}

export interface MediaItem {
  url: string
  name: string
  type: string
}

export interface IMDBRecord {
  id: string
  media: MediaItem[]
  status: "queued" | "processing" | "done" | "error"
  fields: {
    itemName:        FieldValue
    barcode:         FieldValue
    manufacturer:    FieldValue
    brand:           FieldValue
    weight:          FieldValue
    packagingType:   FieldValue
    country:         FieldValue
    variant:         FieldValue
    type:            FieldValue
    fragranceFlavor: FieldValue
    promotion:       FieldValue
    addons:          FieldValue
    tagline:         FieldValue
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

export interface RawExtractedFields {
  itemName:        GeminiFieldResult
  barcode:         GeminiFieldResult
  manufacturer:    GeminiFieldResult
  brand:           GeminiFieldResult
  weight:          GeminiFieldResult
  packagingType:   GeminiFieldResult
  country:         GeminiFieldResult
  variant:         GeminiFieldResult
  type:            GeminiFieldResult
  fragranceFlavor: GeminiFieldResult
  promotion:       GeminiFieldResult
  addons:          GeminiFieldResult
  tagline:         GeminiFieldResult
}

export interface ValidatedFieldResult extends GeminiFieldResult {
  isValid: boolean
  source: "gemini" | "groq" | "override"
}

export interface ValidatedFields {
  itemName:        ValidatedFieldResult
  barcode:         ValidatedFieldResult
  manufacturer:    ValidatedFieldResult
  brand:           ValidatedFieldResult
  weight:          ValidatedFieldResult
  packagingType:   ValidatedFieldResult
  country:         ValidatedFieldResult
  variant:         ValidatedFieldResult
  type:            ValidatedFieldResult
  fragranceFlavor: ValidatedFieldResult
  promotion:       ValidatedFieldResult
  addons:          ValidatedFieldResult
  tagline:         ValidatedFieldResult
}
