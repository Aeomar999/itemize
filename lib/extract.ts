import { IMDBRecord, MediaItem } from '@/types/imdb'

export async function extractItemizeData(id: string, mediaItems: MediaItem[], barcodeOverride?: string | null): Promise<Partial<IMDBRecord>> {
  const formData = new FormData()
  
  for (const media of mediaItems) {
    const res = await fetch(media.url)
    const blob = await res.blob()
    formData.append("media", new File([blob], media.name, { type: blob.type }))
  }

  if (barcodeOverride) {
    formData.append("barcodeOverride", barcodeOverride)
  }

  const response = await fetch("/api/extract", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errObj = await response.json().catch(() => ({}))
    throw new Error(errObj.error || "Failed to extract data")
  }

  const data = await response.json()
  
  return {
    status: "done",
    fields: data.fields
  }
}
