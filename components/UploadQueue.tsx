"use client"

import { useItemizeStore } from "@/store/useItemizeStore"

export function UploadQueue() {
  const records = useItemizeStore(state => state.records)

  if (records.length === 0) return null

  const processing = records.filter(r => r.status === "processing").length
  const done = records.filter(r => r.status === "done").length
  const error = records.filter(r => r.status === "error").length

  const total = records.length
  const progressPercent = Math.round(((done + error) / total) * 100)

  if (processing === 0 && error === 0) return null

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 bg-white border border-slate-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Extraction Progress</span>
        <span className="text-sm text-slate-500">
          {done + error} / {total}
        </span>
      </div>
      
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div 
          className="bg-slate-900 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex gap-4 mt-3 text-xs font-medium">
        {processing > 0 && <span className="text-blue-600">{processing} Processing</span>}
        {done > 0 && <span className="text-emerald-600">{done} Extracted</span>}
        {error > 0 && <span className="text-red-600">{error} Failed</span>}
      </div>
    </div>
  )
}
