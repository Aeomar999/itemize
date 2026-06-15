import { Schema, Type } from "@google/generative-ai"

const FieldSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    value: { type: Type.STRING, nullable: true },
    confidence: { type: Type.NUMBER },
  },
  required: ["value", "confidence"],
}

export const ItemizeExtractionSchema: Schema = {
  type: Type.OBJECT,
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
