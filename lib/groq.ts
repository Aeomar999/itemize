import { RawExtractedFields, GeminiFieldResult } from "@/types/imdb"
import { buildPromptWithBarcode, RETRY_SYSTEM_INSTRUCTION } from "@/lib/prompt"

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct" // best Groq vision model

function getGroqKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error("GROQ_API_KEY environment variable is missing")
  return key
}

function cleanJson(raw: string): string {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

/**
 * Full 13-field extraction via Groq — used as Gemini fallback
 */
export async function groqExtractFull(
  files: File[],
  barcodeOverride?: string | null
): Promise<RawExtractedFields> {
  // Process all images (similar to Gemini's multi-image approach)
  const imageContents = await Promise.all(
    files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const base64 = buffer.toString("base64")
      return {
        type: "image_url" as const,
        image_url: { url: `data:${file.type};base64,${base64}` },
      }
    })
  )

  const promptText = buildPromptWithBarcode(barcodeOverride)
  const textContent = {
    type: "text" as const,
    text: `${promptText}\n\nReturn ONLY a raw JSON object with exactly these 13 keys, each with "value" and "confidence":\nitemName, barcode, manufacturer, brand, weight, packagingType, country, variant, type, fragranceFlavor, promotion, addons, tagline`,
  }

  const messages = [
    {
      role: "user" as const,
      content: [...imageContents, textContent],
    },
  ]

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getGroqKey()}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a retail product data extraction specialist. Return ONLY raw JSON, no markdown, no explanation." },
          ...messages,
        ],
        temperature: 0,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Groq API error: ${response.status} — ${err}`)
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ""
    const cleaned = cleanJson(raw)

    try {
      const parsed = JSON.parse(cleaned)

      // Validate structure matches RawExtractedFields
      const requiredFields = [
        "itemName", "barcode", "manufacturer", "brand", "weight",
        "packagingType", "country", "variant", "type", "fragranceFlavor",
        "promotion", "addons", "tagline"
      ]

      for (const field of requiredFields) {
        if (!parsed[field] || typeof parsed[field] !== "object") {
          throw new Error(`Missing or invalid field: ${field}`)
        }
        if (!("value" in parsed[field]) || !("confidence" in parsed[field])) {
          throw new Error(`Field ${field} missing value or confidence`)
        }
        if (typeof parsed[field].confidence !== "number") {
          throw new Error(`Field ${field} has non-numeric confidence`)
        }
      }

      return parsed as RawExtractedFields
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Groq response could not be parsed as JSON: ${cleaned.slice(0, 200)}`)
      }
      throw error
    }
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Groq API request timed out after 30 seconds")
    }
    throw error
  }
}

/**
 * Single-field retry via Groq — used when Gemini confidence is low
 */
export async function groqRetryField(
  fieldName: string,
  fieldPrompt: string,
  files: File[]
): Promise<GeminiFieldResult | null> {
  try {
    // Process all images for comprehensive field extraction
    const imageContents = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const base64 = buffer.toString("base64")
        return {
          type: "image_url" as const,
          image_url: { url: `data:${file.type};base64,${base64}` },
        }
      })
    )

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getGroqKey()}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: RETRY_SYSTEM_INSTRUCTION },
            {
              role: "user",
              content: [
                ...imageContents,
                {
                  type: "text",
                  text: `${fieldPrompt}\n\nReturn ONLY: {"value": "...", "confidence": 0.0}`,
                },
              ],
            },
          ],
          temperature: 0,
          max_tokens: 128,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (!response.ok) return null

      const data = await response.json()
      const raw = data.choices?.[0]?.message?.content ?? ""
      const cleaned = cleanJson(raw)
      return JSON.parse(cleaned) as GeminiFieldResult
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        console.error(`Groq retry timed out for field ${fieldName}`)
      }
      throw error
    }
  } catch {
    console.error(`Groq retry failed for field ${fieldName}`)
    return null
  }
}
