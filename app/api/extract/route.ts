import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { ItemizeExtractionSchema } from "@/lib/schema"
import { SYSTEM_INSTRUCTION, buildPromptWithBarcode } from "@/lib/prompt"
import { normalizeWeight, normalizePackaging, normalizeCountry } from "@/lib/normalize"
import { validateBarcode } from "@/lib/validate"
import { NormalizedFields, ValidatedFields, ValidatedFieldResult } from "@/types/imdb"

// Ensure we have an API key
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is missing")
}

const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
  systemInstruction: SYSTEM_INSTRUCTION,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: ItemizeExtractionSchema,
    temperature: 0.0,
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const mediaFiles = formData.getAll("media") as File[]
    const barcodeOverride = formData.get("barcodeOverride") as string | null

    if (!mediaFiles || mediaFiles.length === 0) {
      return NextResponse.json({ error: "Missing media files" }, { status: 400 })
    }
    
    const prompt = buildPromptWithBarcode(barcodeOverride)

    // Convert Files to inlineData parts
    const inlineDataParts = await Promise.all(mediaFiles.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      return {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type,
        }
      }
    }))

    // Call Gemini
    const result = await model.generateContent([
      prompt,
      ...inlineDataParts
    ])

    const responseText = result.response.text()
    
    let rawJson: NormalizedFields
    try {
      rawJson = JSON.parse(responseText) as NormalizedFields
    } catch (e) {
      // In case of parsing failure (which is rare with structured outputs)
      console.error("Failed to parse Gemini output:", responseText)
      return NextResponse.json({ error: "Failed to parse structured JSON from model" }, { status: 500 })
    }

    // Process and Normalize Data
    const validatedFields: ValidatedFields = {
      barcode: {
        value: barcodeOverride || rawJson.barcode?.value || null,
        confidence: barcodeOverride ? 1.0 : (rawJson.barcode?.confidence ?? 0),
        isValid: validateBarcode(barcodeOverride || rawJson.barcode?.value || null),
        source: barcodeOverride ? "override" : "gemini",
      },
      categoryType: {
        value: rawJson.categoryType?.value || null,
        confidence: rawJson.categoryType?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      segmentType: {
        value: rawJson.segmentType?.value || null,
        confidence: rawJson.segmentType?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      manufacturer: {
        value: rawJson.manufacturer?.value || null,
        confidence: rawJson.manufacturer?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      brand: {
        value: rawJson.brand?.value || null,
        confidence: rawJson.brand?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      productName: {
        value: rawJson.productName?.value || null,
        confidence: rawJson.productName?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      weightAndUnit: {
        value: normalizeWeight(rawJson.weightAndUnit?.value || null),
        confidence: rawJson.weightAndUnit?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      packagingType: {
        value: normalizePackaging(rawJson.packagingType?.value || null),
        confidence: rawJson.packagingType?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      countryOfOrigin: {
        value: normalizeCountry(rawJson.countryOfOrigin?.value || null),
        confidence: rawJson.countryOfOrigin?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
      promotionalMessages: {
        value: rawJson.promotionalMessages?.value || null,
        confidence: rawJson.promotionalMessages?.confidence ?? 0,
        isValid: true,
        source: "gemini",
      },
    }

    // Return the fields wrapped exactly how IMDBRecord expects (omitting frontend client-state keys)
    return NextResponse.json({
      fields: validatedFields
    })

  } catch (error: any) {
    console.error("Error in /api/extract:", error)
    return NextResponse.json(
      { error: error?.message || "Internal server error during extraction" },
      { status: 500 }
    )
  }
}
