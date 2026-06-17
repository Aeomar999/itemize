import { NextRequest, NextResponse } from "next/server"
import { twoPassExtract } from "@/lib/twoPass"

export const maxDuration = 60 // Allow up to 60 seconds for Gemini/Groq API calls

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const mediaFiles = formData.getAll("media") as File[]
    const barcodeOverride = formData.get("barcodeOverride") as string | null

    if (!mediaFiles || mediaFiles.length === 0) {
      return NextResponse.json({ error: "Missing media files" }, { status: 400 })
    }

    const fields = await twoPassExtract(mediaFiles, barcodeOverride)
    return NextResponse.json({ fields })

  } catch (error: unknown) {
    console.error("Error in /api/extract:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
