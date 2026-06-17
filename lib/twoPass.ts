import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai"
import { ItemizeExtractionSchema } from "@/lib/schema"
import { SYSTEM_INSTRUCTION, RETRY_SYSTEM_INSTRUCTION, buildPromptWithBarcode, FIELD_RETRY_PROMPTS } from "@/lib/prompt"
import { ValidatedFields, RawExtractedFields, GeminiFieldResult, ValidatedFieldResult } from "@/types/imdb"
import { normalizeWeight, normalizePackaging, normalizeCountry } from "@/lib/normalize"
import { validateBarcode } from "@/lib/validate"
import { groqExtractFull, groqRetryField } from "@/lib/groq"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SingleFieldSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    value: { type: SchemaType.STRING, nullable: true },
    confidence: { type: SchemaType.NUMBER },
  },
  required: ["value", "confidence"],
}

const primaryModel = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite",
  systemInstruction: SYSTEM_INSTRUCTION,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: ItemizeExtractionSchema,
    temperature: 0.0,
  },
})

const retryModel = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite",
  systemInstruction: RETRY_SYSTEM_INSTRUCTION,
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: SingleFieldSchema,
    temperature: 0.0,
  },
})

// Fields eligible for second-pass retry
const RETRY_FIELDS = [
  "barcode", "country", "manufacturer", "weight",
  "packagingType", "type", "fragranceFlavor", "variant",
  "promotion", "tagline",
] as const

type RetryField = typeof RETRY_FIELDS[number]

// Confidence threshold below which a retry is triggered
const CONFIDENCE_THRESHOLD = 0.70

type InlineDataPart = {
  inlineData: { data: string; mimeType: string }
}

async function filesToInlineData(files: File[]): Promise<InlineDataPart[]> {
  return Promise.all(files.map(async (file) => ({
    inlineData: {
      data: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mimeType: file.type,
    },
  })))
}

/**
 * Gemini single-field retry
 */
async function geminiRetryField(
  field: RetryField,
  inlineDataParts: InlineDataPart[]
): Promise<GeminiFieldResult | null> {
  const prompt = FIELD_RETRY_PROMPTS[field]
  if (!prompt) return null
  try {
    const result = await retryModel.generateContent([prompt, ...inlineDataParts])
    return JSON.parse(result.response.text()) as GeminiFieldResult
  } catch {
    return null
  }
}

/**
 * Applies normalization to raw extracted fields
 */
function applyNormalization(raw: RawExtractedFields, barcodeOverride?: string | null): ValidatedFields {
  return {
    itemName: {
      value: raw.itemName?.value || null,
      confidence: raw.itemName?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    barcode: {
      value: (barcodeOverride || raw.barcode?.value || null)?.replace(/\D/g, "") || null,
      confidence: barcodeOverride ? 1.0 : (raw.barcode?.confidence ?? 0),
      isValid: validateBarcode(barcodeOverride || raw.barcode?.value || null),
      source: barcodeOverride ? "override" : "gemini",
    },
    manufacturer: {
      value: raw.manufacturer?.value || null,
      confidence: raw.manufacturer?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    brand: {
      value: raw.brand?.value || null,
      confidence: raw.brand?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    weight: {
      value: normalizeWeight(raw.weight?.value || null),
      confidence: raw.weight?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    packagingType: {
      value: normalizePackaging(raw.packagingType?.value || null),
      confidence: raw.packagingType?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    country: {
      value: normalizeCountry(raw.country?.value || null),
      confidence: raw.country?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    variant: {
      value: raw.variant?.value || null,
      confidence: raw.variant?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    type: {
      value: raw.type?.value || null,
      confidence: raw.type?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    fragranceFlavor: {
      value: raw.fragranceFlavor?.value || null,
      confidence: raw.fragranceFlavor?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    promotion: {
      value: raw.promotion?.value || null,
      confidence: raw.promotion?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    addons: {
      value: raw.addons?.value || null,
      confidence: raw.addons?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
    tagline: {
      value: raw.tagline?.value || null,
      confidence: raw.tagline?.confidence ?? 0,
      isValid: true,
      source: "gemini",
    },
  }
}

/**
 * Full two-pass extraction pipeline with Groq fallback:
 *
 * 1. Try Gemini primary extraction (all 13 fields)
 *    → If Gemini fails entirely: fall back to Groq for full extraction
 * 2. For any field below CONFIDENCE_THRESHOLD:
 *    → Try Gemini focused retry first
 *    → If Gemini retry fails or scores lower: try Groq retry
 *    → Keep whichever result has highest confidence
 */
export async function twoPassExtract(
  files: File[],
  barcodeOverride?: string | null
): Promise<ValidatedFields> {
  const inlineDataParts = await filesToInlineData(files)
  const prompt = buildPromptWithBarcode(barcodeOverride)

  // --- Pass 1: Gemini primary extraction ---
  let rawJson: RawExtractedFields
  let usedGroqPrimary = false

  try {
    const result = await primaryModel.generateContent([prompt, ...inlineDataParts])
    rawJson = JSON.parse(result.response.text()) as RawExtractedFields
  } catch (geminiError) {
    console.warn("Gemini primary extraction failed, falling back to Groq:", geminiError)
    try {
      rawJson = await groqExtractFull(files, barcodeOverride)
      usedGroqPrimary = true
    } catch (groqError) {
      throw new Error(`Both Gemini and Groq extraction failed. Gemini: ${geminiError}. Groq: ${groqError}`)
    }
  }

  // --- Pass 2: Targeted retries for low-confidence fields ---
  const fieldSources: Record<string, "gemini" | "groq"> = {}

  if (!usedGroqPrimary) {
    const retryTargets = RETRY_FIELDS.filter(field => {
      if (field === "barcode" && barcodeOverride) return false
      return (rawJson[field]?.confidence ?? 0) < CONFIDENCE_THRESHOLD
    })

    const retryResults = await Promise.all(
      retryTargets.map(async (field) => {
        const fieldPrompt = FIELD_RETRY_PROMPTS[field]
        const originalConfidence = rawJson[field]?.confidence ?? 0

        // Try Gemini retry first
        const geminiRetry = await geminiRetryField(field, inlineDataParts)
        if (geminiRetry && geminiRetry.confidence > originalConfidence) {
          return { field, result: geminiRetry, source: "gemini" as const }
        }

        // Try Groq retry if Gemini retry didn't improve
        const groqRetry = await groqRetryField(field, fieldPrompt, files)
        const bestRetry = [
          { result: geminiRetry, source: "gemini" as const },
          { result: groqRetry, source: "groq" as const }
        ]
          .filter(item => item.result !== null)
          .sort((a, b) => (b.result!.confidence ?? 0) - (a.result!.confidence ?? 0))[0]

        if (bestRetry && bestRetry.result && bestRetry.result.confidence > originalConfidence) {
          return { field, result: bestRetry.result, source: bestRetry.source }
        }

        return null
      })
    )

    // Merge improved results back into rawJson, tracking source
    for (const item of retryResults) {
      if (!item) continue
      rawJson[item.field] = item.result
      fieldSources[item.field] = item.source
    }
  }

  // --- Build final ValidatedFields with normalization ---
  const validated = applyNormalization(rawJson, barcodeOverride)

  // Tag fields that came from Groq primary
  if (usedGroqPrimary) {
    for (const key of Object.keys(validated) as (keyof ValidatedFields)[]) {
      if (key !== "barcode" || !barcodeOverride) {
        validated[key].source = "groq"
      }
    }
  } else {
    // Apply source information from retry results
    for (const [field, source] of Object.entries(fieldSources)) {
      if (field in validated) {
        (validated as unknown as Record<string, ValidatedFieldResult>)[field].source = source
      }
    }
  }

  return validated
}
