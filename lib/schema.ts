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
    barcode: FieldSchema,
    categoryType: FieldSchema,
    segmentType: FieldSchema,
    manufacturer: FieldSchema,
    brand: FieldSchema,
    productName: FieldSchema,
    weightAndUnit: FieldSchema,
    packagingType: FieldSchema,
    countryOfOrigin: FieldSchema,
    promotionalMessages: FieldSchema,
  },
  required: [
    "barcode",
    "categoryType",
    "segmentType",
    "manufacturer",
    "brand",
    "productName",
    "weightAndUnit",
    "packagingType",
    "countryOfOrigin",
    "promotionalMessages",
  ],
}
