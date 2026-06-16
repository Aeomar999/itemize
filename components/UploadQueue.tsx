"use client"

import { useItemizeStore } from "@/store/useItemizeStore"
import { useEffect, useState } from "react"
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid"

export function UploadQueue() {
  const records = useItemizeStore(state => state.records)
  const [isVisible, setIsVisible] = useState(false)

  const isProcessing = records.some(r => r.status === "queued" || r.status === "processing")

  useEffect(() => {
    if (isProcessing) {
      setIsVisible(true)
    } else if (records.length > 0) {
      const timer = setTimeout(() => setIsVisible(false), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isProcessing, records.length])

  if (!isVisible || records.length === 0) return null

  const done = records.filter(r => r.status === "done").length
  const error = records.filter(r => r.status === "error").length
  const total = records.length
  const progressPercent = Math.round(((done + error) / total) * 100) || 0

  return (
    <div className="w-full max-w-[1400px] mx-auto mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-700">Extraction Progress</span>
        <span className="text-sm text-slate-500">Processing {done + error} of {total} images...</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
        <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
        {records.map(record => (
          <div key={record.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded overflow-hidden bg-slate-100 flex-shrink-0">
                {record.media[0]?.type === "video" ? (
                  <span className="text-xs font-semibold text-slate-500 w-full h-full flex items-center justify-center">VID</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={record.media[0]?.url} alt={record.media[0]?.name} className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-sm text-slate-700 font-medium truncate max-w-[200px] sm:max-w-[400px]">
                {(record.media[0]?.name || "Unknown").length > 24
                  ? (record.media[0]?.name || "Unknown").substring(0, 24) + "..."
                  : (record.media[0]?.name || "Unknown")}
              </span>
            </div>

            <div>
              {record.status === "queued" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">Queued</span>
              )}
              {record.status === "processing" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                  <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing
                </span>
              )}
              {record.status === "done" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <CheckCircleIcon className="w-3.5 h-3.5" /> Done
                </span>
              )}
              {record.status === "error" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                  <XCircleIcon className="w-3.5 h-3.5" /> Error
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
