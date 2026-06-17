"use client"

import { IMDBRecord, IMDBFieldKey } from "@/types/imdb"
import { useItemizeStore } from "@/store/useItemizeStore"
import { TrashIcon, ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline"
import { ConfidenceBadge } from "./ConfidenceBadge"
import { DuplicateWarning } from "./DuplicateWarning"
import { extractItemizeData } from "@/lib/extract"
import { PencilSquareIcon } from "@heroicons/react/20/solid"
import { useState, useRef } from "react"

interface Props { record: IMDBRecord }

// Source badge — shows if a field came from Groq fallback
function SourceBadge({ source }: { source?: string }) {
  if (source !== "groq") return null
  return (
    <span className="inline-flex items-center text-[9px] font-bold tracking-wide uppercase text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
      Groq
    </span>
  )
}

export function TableRow({ record }: Props) {
  const updateField = useItemizeStore(state => state.updateField)
  const removeRecord = useItemizeStore(state => state.removeRecord)
  const updateRecord = useItemizeStore(state => state.updateRecord)
  const recalculateNeedsReview = useItemizeStore(state => state.recalculateNeedsReview)
  const recalculateDuplicates = useItemizeStore(state => state.recalculateDuplicates)
  const addMediaToRecord = useItemizeStore(state => state.addMediaToRecord)

  const [editingField, setEditingField] = useState<IMDBFieldKey | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const isVideo = file.type.startsWith("video/")
      const newMedia = { url: URL.createObjectURL(file), name: file.name, type: isVideo ? "video" : "image" }
      addMediaToRecord(record.id, newMedia)
      const allMedia = [...record.media, newMedia]
      updateRecord(record.id, { status: "processing" })
      try {
        const result = await extractItemizeData(record.id, allMedia)
        updateRecord(record.id, result)
      } catch (err: unknown) {
        updateRecord(record.id, { status: "error", error: err instanceof Error ? err.message : "Failed" })
      }
      recalculateNeedsReview(record.id)
      recalculateDuplicates()
    }
  }

  const startEdit = (field: IMDBFieldKey, value: string) => {
    setEditingField(field)
    setEditValue(value)
  }

  const saveEdit = () => {
    if (editingField) updateField(record.id, editingField, editValue)
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); saveEdit() }
    else if (e.key === "Escape") setEditingField(null)
  }

  const handleRetry = async () => {
    updateRecord(record.id, { status: "processing", error: null })
    try {
      const result = await extractItemizeData(record.id, record.media)
      updateRecord(record.id, result)
    } catch {
      updateRecord(record.id, { status: "error", error: "Retry failed" })
    }
    recalculateNeedsReview(record.id)
    recalculateDuplicates()
  }

  let borderLeftClass = "border-l-4 border-transparent"
  if (record.status === "error") borderLeftClass = "border-l-4 border-red-400"
  else if (record.needsReview) borderLeftClass = "border-l-4 border-yellow-400"

  const renderCell = (field: IMDBFieldKey, placeholder = "—", label?: string) => {
    const data = record.fields[field]
    const isPrimary = field === "itemName" || field === "brand" || field === "manufacturer" || field === "barcode"
    const mobileSpanClass = isPrimary ? "col-span-2" : "col-span-1"

    if (record.status === "processing") {
      return (
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-2.5 mt-1.5">
            <div className="animate-pulse bg-slate-200/60 rounded h-3.5 w-[85%]" />
            <div className="animate-pulse bg-slate-200/60 rounded h-3.5 w-1/2" />
          </div>
        </td>
      )
    }

    const isCurrentlyEditing = editingField === field

    return (
      <td
        className={`px-3 py-2 sm:px-4 sm:py-3 align-top transition-colors group-hover:bg-slate-50/50 relative ${data.isEdited ? "bg-blue-50/30" : ""} block sm:table-cell ${mobileSpanClass}`}
        onClick={() => { if (!isCurrentlyEditing) startEdit(field, data.value || "") }}
      >
        <div className="flex justify-between items-start mb-1 sm:hidden gap-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight pt-0.5">{label}</div>
          <div className="flex gap-1 pointer-events-none flex-shrink-0">
            {data.isEdited ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200/50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                <PencilSquareIcon className="w-2.5 h-2.5" />
                Edited
              </span>
            ) : (
              <>
                <SourceBadge source={(data as { source?: string }).source} />
                <ConfidenceBadge confidence={data.confidence} />
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:gap-1.5 min-h-[32px] sm:min-h-[44px] group/cell h-full">
          {isCurrentlyEditing ? (
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveEdit}
                placeholder={placeholder}
                className={`w-full min-w-[120px] px-2.5 py-1.5 text-sm bg-white rounded-md shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all absolute z-20 top-0 left-0 ${isPrimary ? "font-semibold text-slate-900" : "font-medium text-slate-800"}`}
              />
              <div className="opacity-0 px-2.5 py-1.5 text-sm pointer-events-none">{editValue || placeholder}</div>
            </div>
          ) : (
            <div className={`w-full min-w-[120px] px-2.5 py-1.5 text-sm cursor-pointer hover:bg-white hover:shadow-sm rounded-md transition-all border border-transparent hover:border-slate-200 ${isPrimary ? "font-medium text-slate-900" : "text-slate-600"}`}>
              {data.value || <span className="text-slate-400 font-normal italic">{placeholder}</span>}
            </div>
          )}
          <div className="hidden sm:flex justify-end gap-1 pr-2 pointer-events-none mt-auto">
            {data.isEdited ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200/50 px-1.5 py-0.5 rounded-full">
                <PencilSquareIcon className="w-2.5 h-2.5" />
                Edited
              </span>
            ) : (
              <>
                <SourceBadge source={(data as { source?: string }).source} />
                <ConfidenceBadge confidence={data.confidence} />
              </>
            )}
          </div>
        </div>
      </td>
    )
  }

  return (
    <>
      {record.duplicateFlag !== "none" && (
        <tr className="bg-white">
          <td colSpan={14} className="p-0 border-b border-slate-100">
            <DuplicateWarning duplicateStatus={record.duplicateFlag} duplicateOf={record.duplicateOf} />
          </td>
        </tr>
      )}

      <tr id={record.id} className="group transition-all bg-white hover:bg-slate-50/80 relative z-0 hover:z-10 grid grid-cols-2 sm:table-row border border-slate-200 sm:border-none rounded-xl sm:rounded-none overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.04)] sm:shadow-none">
        <td className={`col-span-2 px-4 py-4 sm:py-3 sticky left-0 z-10 bg-slate-50 sm:bg-white/90 backdrop-blur-sm border-b sm:border-b-0 sm:border-r border-slate-100 align-top group-hover:bg-slate-50/90 transition-colors block sm:table-cell ${borderLeftClass}`}>
          <div className="flex flex-row sm:flex-col items-center gap-4 sm:gap-2 w-full">
            <div className="relative group/image w-20 h-20 sm:w-16 sm:h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex-shrink-0">
              <div
                className="absolute inset-0 cursor-zoom-in z-0"
                onClick={() => window.open(record.media[0]?.url, "_blank")}
              />
              {record.media[0]?.type === "video" ? (
                <span className="text-xs font-semibold text-slate-500 absolute inset-0 flex items-center justify-center pointer-events-none">VID</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={record.media[0]?.url} alt={record.media[0]?.name} className="w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110 pointer-events-none" />
              )}
              {record.media.length > 1 && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white pointer-events-none z-10">
                  +{record.media.length - 1}
                </div>
              )}
              {record.needsReview && record.status !== "error" && (
                <span className="absolute -bottom-2 -left-1 text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1 rounded shadow-sm pointer-events-none z-10">
                  ⚠ REVIEW
                </span>
              )}
              
              {/* Desktop: Overlay with buttons on hover */}
              <div className="hidden sm:flex absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-all items-center justify-center gap-1.5 backdrop-blur-[1px] z-20">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="p-1.5 bg-white/95 text-slate-700 rounded hover:bg-white hover:text-blue-600 transition-colors shadow-sm transform translate-y-1 group-hover/image:translate-y-0"
                  disabled={record.status === "processing"}
                  title="Add Media"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeRecord(record.id) }}
                  className="p-1.5 bg-white/95 text-slate-700 rounded hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm transform -translate-y-1 group-hover/image:translate-y-0"
                  title="Delete Record"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {/* Mobile: Buttons shown beside image */}
            <div className="flex sm:hidden flex-col justify-center gap-2 w-full">
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                className="w-full py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded shadow-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                disabled={record.status === "processing"}
                title="Add Media"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Media
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeRecord(record.id) }}
                className="w-full py-2 bg-white border border-slate-200 text-slate-500 text-xs font-semibold rounded shadow-sm flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Delete Record"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddMedia} />
          </div>
        </td>

        {record.status === "error" ? (
          <td colSpan={13} className="px-4 py-3 align-middle bg-red-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Extraction Failed</h3>
                <p className="text-xs text-red-600 mt-0.5">{record.error === "Internal server error" ? "The AI extraction service encountered an issue. Please try again." : record.error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-700 text-xs font-medium rounded-md hover:bg-red-50 transition-colors shadow-sm"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                Try Again
              </button>
            </div>
          </td>
        ) : (
          <>
            {renderCell("itemName",        "Full catalog name", "Item Name")}
            {renderCell("barcode",         "e.g. 6033001...", "Barcode")}
            {renderCell("manufacturer",    "e.g. NESTLE", "Manufacturer")}
            {renderCell("brand",           "e.g. MILO", "Brand")}
            {renderCell("weight",          "e.g. 400G", "Weight")}
            {renderCell("packagingType",   "e.g. TIN", "Packaging")}
            {renderCell("country",         "e.g. GHANA", "Country")}
            {renderCell("variant",         "e.g. ORIGINAL", "Variant")}
            {renderCell("type",            "e.g. POWDER", "Type")}
            {renderCell("fragranceFlavor", "e.g. CHOCOLATE", "Fragrance/Flavor")}
            {renderCell("promotion",       "e.g. BUY NOW GHS33", "Promotion")}
            {renderCell("addons",          "e.g. 5 FREE ENVELOPE", "Addons")}
            {renderCell("tagline",         "e.g. SUPPORTS ENERGY RELEASE", "Tagline")}
          </>
        )}

      </tr>
    </>
  )
}
