"use client"

import { IMDBRecord, IMDBFieldKey } from "@/types/imdb"
import { useItemizeStore } from "@/store/useItemizeStore"
import { TrashIcon, ArrowPathIcon } from "@heroicons/react/24/outline"
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

  const renderCell = (field: IMDBFieldKey, placeholder = "—") => {
    const data = record.fields[field]

    if (record.status === "processing") {
      return (
        <td className="px-4 py-3 align-top">
          <div className="flex flex-col gap-2">
            <div className="animate-pulse bg-slate-200 rounded h-4 w-full" />
            <div className="animate-pulse bg-slate-200 rounded h-4 w-2/3" />
          </div>
        </td>
      )
    }

    const isCurrentlyEditing = editingField === field

    return (
      <td
        className={`px-4 py-3 align-top transition-colors group-hover:bg-slate-50 relative ${data.isEdited ? "bg-blue-50/50" : ""}`}
        onClick={() => { if (!isCurrentlyEditing) startEdit(field, data.value || "") }}
      >
        <div className="flex flex-col gap-1.5 min-h-[44px]">
          {isCurrentlyEditing ? (
            <input
              autoFocus
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveEdit}
              placeholder={placeholder}
              className="w-full min-w-[120px] px-2 py-1 text-sm bg-white border-b-2 border-blue-500 shadow-sm focus:outline-none"
            />
          ) : (
            <div className="w-full min-w-[120px] px-2 py-1 text-sm cursor-pointer hover:bg-black/5 rounded transition-colors text-slate-800">
              {data.value || <span className="text-slate-400 italic">{placeholder}</span>}
            </div>
          )}
          <div className="flex justify-end gap-1 pr-2 pointer-events-none">
            {data.isEdited ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                <PencilSquareIcon className="w-3 h-3" />
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
          <td colSpan={15} className="p-0 border-b border-slate-100">
            <DuplicateWarning duplicateStatus={record.duplicateFlag} duplicateOf={record.duplicateOf} />
          </td>
        </tr>
      )}

      <tr id={record.id} className="group transition-colors even:bg-slate-50 odd:bg-white relative">
        <td className={`px-4 py-3 sticky left-0 z-10 bg-inherit border-r border-slate-200 align-top ${borderLeftClass}`}>
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div
                className="w-16 h-16 rounded overflow-hidden border border-slate-200 cursor-zoom-in bg-slate-100 flex items-center justify-center"
                onClick={() => window.open(record.media[0]?.url, "_blank")}
              >
                {record.media[0]?.type === "video" ? (
                  <span className="text-xs font-semibold text-slate-500">VID</span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={record.media[0]?.url} alt={record.media[0]?.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                )}
              </div>
              {record.media.length > 1 && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
                  +{record.media.length - 1}
                </div>
              )}
              {record.needsReview && record.status !== "error" && (
                <span className="absolute -bottom-2 -left-1 text-[9px] font-bold bg-yellow-400 text-yellow-900 px-1 rounded shadow-sm">
                  ⚠ REVIEW
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 transition-colors w-full flex items-center justify-center gap-1 shadow-sm"
              disabled={record.status === "processing"}
            >
              ➕ Media
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddMedia} />
          </div>
        </td>

        {record.status === "error" ? (
          <td colSpan={13} className="px-4 py-3 align-middle bg-red-50/30">
            <div className="text-red-600 text-sm font-medium">Extraction failed — {record.error}</div>
          </td>
        ) : (
          <>
            {renderCell("itemName",        "Full catalog name")}
            {renderCell("barcode",         "e.g. 6033001...")}
            {renderCell("manufacturer",    "e.g. NESTLE")}
            {renderCell("brand",           "e.g. MILO")}
            {renderCell("weight",          "e.g. 400G")}
            {renderCell("packagingType",   "e.g. TIN")}
            {renderCell("country",         "e.g. GHANA")}
            {renderCell("variant",         "e.g. ORIGINAL")}
            {renderCell("type",            "e.g. POWDER")}
            {renderCell("fragranceFlavor", "e.g. CHOCOLATE")}
            {renderCell("promotion",       "e.g. BUY NOW GHS33")}
            {renderCell("addons",          "e.g. 5 FREE ENVELOPE")}
            {renderCell("tagline",         "e.g. SUPPORTS ENERGY RELEASE")}
          </>
        )}

        <td className="px-4 py-3 text-right align-top border-l border-slate-100 bg-inherit">
          <div className="flex flex-col items-end gap-2 h-full">
            {record.status === "error" ? (
              <button onClick={handleRetry} className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 text-slate-700 text-xs rounded hover:bg-slate-50 transition-colors">
                <ArrowPathIcon className="w-3 h-3" />
                Retry
              </button>
            ) : record.status === "processing" ? (
              <span className="text-xs font-medium text-slate-500 italic">Processing...</span>
            ) : null}
            <button
              onClick={() => removeRecord(record.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 mt-auto"
              title="Delete Record"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    </>
  )
}
