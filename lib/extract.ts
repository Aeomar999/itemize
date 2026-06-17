import { ValidatedFields, MediaItem, IMDBRecord, IMDBFieldKey } from "@/types/imdb"

export function mapApiFieldsToRecord(fields: ValidatedFields): IMDBRecord["fields"] {
  const mapped = {} as Record<string, { value: string | null; confidence: number; isEdited: boolean; isValid: boolean; source?: string }>
  for (const key of Object.keys(fields) as IMDBFieldKey[]) {
    const f = fields[key]
    mapped[key] = { value: f.value, confidence: f.confidence, isEdited: false, isValid: f.isValid, source: f.source }
  }
  return mapped as IMDBRecord["fields"]
}

export async function extractItemizeData(
  _id: string,
  mediaItems: MediaItem[]
): Promise<{ status: "done" | "error"; fields?: IMDBRecord["fields"]; error?: string }> {
  try {
    const formData = new FormData()
    for (const item of mediaItems) {
      const res = await fetch(item.url)
      if (!res.ok) continue
      const blob = await res.blob()
      formData.append("media", new File([blob], item.name, { type: blob.type || "image/jpeg" }))
    }

    const response = await fetch("/api/extract", { method: "POST", body: formData })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: "Server error" }))
      throw new Error(err.error || `HTTP ${response.status}`)
    }

    const { fields } = (await response.json()) as { fields: ValidatedFields }
    return { status: "done", fields: mapApiFieldsToRecord(fields) }
  } catch (error) {
    return { status: "error", error: error instanceof Error ? error.message : "Extraction failed" }
  }
}
