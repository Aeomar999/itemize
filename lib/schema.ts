import { Schema, SchemaType } from "@google/generative-ai"

const FieldSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    value: { type: SchemaType.STRING, nullable: true },
    confidence: { type: SchemaType.NUMBER },
  },
  required: ["value", "confidence"],
}

export const ItemizeExtractionSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    itemName:        FieldSchema,
    barcode:         FieldSchema,
    manufacturer:    FieldSchema,
    brand:           FieldSchema,
    weight:          FieldSchema,
    packagingType:   FieldSchema,
    country:         FieldSchema,
    variant:         FieldSchema,
    type:            FieldSchema,
    fragranceFlavor: FieldSchema,
    promotion:       FieldSchema,
    addons:          FieldSchema,
    tagline:         FieldSchema,
  },
  required: [
    "itemName", "barcode", "manufacturer", "brand", "weight",
    "packagingType", "country", "variant", "type", "fragranceFlavor",
    "promotion", "addons", "tagline",
  ],
}
