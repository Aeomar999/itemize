import { RawExtractedFields, GeminiFieldResult } from "@/types/imdb"
import { buildGroqMessages, RETRY_SYSTEM_INSTRUCTION } from "@/lib/prompt"

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
  // Use first image only (Groq processes one image per call efficiently)
  const file = files[0]
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString("base64")

  const messages = buildGroqMessages(base64, file.type, barcodeOverride)

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
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content ?? ""
  const cleaned = cleanJson(raw)

  try {
    return JSON.parse(cleaned) as RawExtractedFields
  } catch {
    throw new Error(`Groq response could not be parsed as JSON: ${cleaned.slice(0, 200)}`)
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
    const file = files[0]
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")

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
              {
                type: "image_url",
                image_url: { url: `data:${file.type};base64,${base64}` },
              },
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
    })

    if (!response.ok) return null

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ""
    const cleaned = cleanJson(raw)
    return JSON.parse(cleaned) as GeminiFieldResult
  } catch {
    console.error(`Groq retry failed for field ${fieldName}`)
    return null
  }
}
