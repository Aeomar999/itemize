"use client"

import { useRef, useState } from "react"
import { PhotoIcon, CameraIcon, CloudArrowUpIcon, VideoCameraIcon } from "@heroicons/react/24/outline"
import { useItemizeStore } from "@/store/useItemizeStore"
import { cn } from "@/lib/utils"
import { ValidatedFields, IMDBFieldKey } from "@/types/imdb"

interface UploadZoneProps {
  isCompressed: boolean
}

function mapApiFieldsToRecord(fields: ValidatedFields): ReturnType<typeof useItemizeStore.getState>["records"][0]["fields"] {
  const mapped = {} as Record<string, { value: string | null; confidence: number; isEdited: boolean; isValid: boolean; source?: string }>
  for (const key of Object.keys(fields) as IMDBFieldKey[]) {
    const f = fields[key]
    mapped[key] = {
      value: f.value,
      confidence: f.confidence,
      isEdited: false,
      isValid: f.isValid,
      source: f.source,
    }
  }
  return mapped as ReturnType<typeof useItemizeStore.getState>["records"][0]["fields"]
}

export function UploadZone({ isCompressed }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const addRecord = useItemizeStore(state => state.addRecord)
  const updateRecord = useItemizeStore(state => state.updateRecord)
  const recalculateNeedsReview = useItemizeStore(state => state.recalculateNeedsReview)
  const recalculateDuplicates = useItemizeStore(state => state.recalculateDuplicates)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadedCount, setUploadedCount] = useState(0)

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"))

    if (fileArray.length === 0) return
    if (uploadedCount + fileArray.length > 20) {
      alert("Too many files — maximum 20 per session")
      return
    }

    setUploadedCount(prev => prev + fileArray.length)

    for (const file of fileArray) {
      let currentId = ""
      const isVideo = file.type.startsWith("video/")
      
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
        const filePath = `${fileName}`
        
        const { error: uploadError } = await import("@/lib/supabase").then(m => m.supabase.storage.from('media').upload(filePath, file))
        if (uploadError) throw uploadError

        const { data: publicUrlData } = await import("@/lib/supabase").then(m => m.supabase.storage.from('media').getPublicUrl(filePath))
        
        const mediaItem = { url: publicUrlData.publicUrl, name: file.name, type: isVideo ? "video" : "image" }
        currentId = addRecord([mediaItem])
        updateRecord(currentId, { status: "processing" })

        const formData = new FormData()
        formData.append("media", file)

        const response = await fetch("/api/extract", { method: "POST", body: formData })

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Server error" }))
          throw new Error(err.error || `HTTP ${response.status}`)
        }

        const { fields } = (await response.json()) as { fields: ValidatedFields }
        updateRecord(currentId, { status: "done", fields: mapApiFieldsToRecord(fields) })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Extraction failed"
        if (currentId) updateRecord(currentId, { status: "error", error: message })
        else console.error("Upload failed before record creation:", message)
      }

      if (currentId) {
        recalculateNeedsReview(currentId)
        recalculateDuplicates()
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files)
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (cameraInputRef.current) cameraInputRef.current.value = ""
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  return (
    <div
      className={cn(
        "w-full max-w-3xl mx-auto mt-8 border rounded-lg flex items-center justify-center cursor-pointer transition-colors group relative overflow-hidden",
        isCompressed ? "py-4 px-4 sm:px-6 border-slate-200 bg-white shadow-sm flex-col sm:flex-row gap-4 sm:gap-0 justify-between" : "p-8 sm:p-12 border-dashed flex-col",
        !isCompressed && isDragging ? "border-blue-500 bg-blue-50/50" : !isCompressed ? "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100/50" : ""
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      {isCompressed && isDragging && (
        <div className="absolute inset-0 bg-blue-50/90 flex items-center justify-center z-10">
          <p className="text-blue-600 font-medium">Drop media to extract</p>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleChange} className="hidden" multiple accept="image/*,video/*" />
      <input type="file" ref={cameraInputRef} onChange={handleChange} className="hidden" accept="image/*" capture="environment" />
      <input type="file" ref={videoInputRef} onChange={handleChange} className="hidden" accept="video/*" capture="environment" />

      <div className={cn("flex items-center", isCompressed ? "flex-col sm:flex-row gap-1 sm:gap-4 text-center sm:text-left" : "flex-col")}>
        {!isCompressed && (
          <div className={cn(
            "w-12 h-12 mb-4 rounded-md flex items-center justify-center transition-colors",
            isDragging ? "bg-blue-100 text-blue-600" : "bg-white border border-slate-200 text-slate-500 shadow-sm"
          )}>
            {isDragging ? <CloudArrowUpIcon className="w-6 h-6" /> : <PhotoIcon className="w-6 h-6" />}
          </div>
        )}
        <div>
          <h2 className={cn("font-medium text-slate-900", isCompressed ? "text-base" : "text-lg text-center")}>
            {!isCompressed && isDragging ? "Drop media to extract" : "Select product media"}
          </h2>
          <p className={cn("text-slate-500", isCompressed ? "text-sm mt-0.5" : "text-sm mt-2 text-center max-w-sm")}>
            {isCompressed ? "Add more media to this session" : "Drag and drop files here, or click to browse. We support images and short videos."}
          </p>
        </div>
      </div>

      <div className={cn("flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto justify-center", isCompressed ? "mt-2 sm:mt-0" : "mt-6")}>
        <button
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
          className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
        >
          {isCompressed ? "Browse" : "Browse Files"}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click() }}
          className="sm:hidden px-4 py-2 bg-white text-slate-700 rounded-md text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <CameraIcon className="w-4 h-4" />
          Photo
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); videoInputRef.current?.click() }}
          className="sm:hidden px-4 py-2 bg-white text-slate-700 rounded-md text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <VideoCameraIcon className="w-4 h-4" />
          Video
        </button>
      </div>
    </div>
  )
}
