"use client"

import { useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useItemizeStore } from "@/store/useItemizeStore"
import { IMDBFieldKey } from "@/types/imdb"
import { Header } from "@/components/Header"
import { ArrowLeftIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline"
import { ConfidenceBadge } from "@/components/ConfidenceBadge"
import { PhotoIcon, PlayCircleIcon } from "@heroicons/react/24/outline"
import { extractItemizeData } from "@/lib/extract"

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : ""
  
  const record = useItemizeStore(state => state.records.find(r => r.id === id))
  const updateField = useItemizeStore(state => state.updateField)
  const addMediaToRecord = useItemizeStore(state => state.addMediaToRecord)
  const updateRecord = useItemizeStore(state => state.updateRecord)
  const recalculateNeedsReview = useItemizeStore(state => state.recalculateNeedsReview)
  const recalculateDuplicates = useItemizeStore(state => state.recalculateDuplicates)
  const removeRecord = useItemizeStore(state => state.removeRecord)

  const [editingField, setEditingField] = useState<IMDBFieldKey | null>(null)
  const [editValue, setEditValue] = useState<string>("")
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!record) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <TrashIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            The product session was lost (perhaps due to a page refresh) or does not exist.
          </p>
          <button 
            onClick={() => router.replace("/")}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Return to Catalog
          </button>
        </div>
      </main>
    )
  }

  const activeMedia = record.media[activeMediaIndex] || record.media[0]

  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const isVideo = file.type.startsWith("video/")
      const newMedia = { url: URL.createObjectURL(file), name: file.name, type: isVideo ? "video" as const : "image" as const }
      
      addMediaToRecord(record.id, newMedia)
      const allMedia = [...record.media, newMedia]
      setActiveMediaIndex(allMedia.length - 1) // Switch to the newly uploaded media
      
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

  const handleDeleteRecord = () => {
    removeRecord(record.id)
    router.replace("/")
  }

  const startEdit = (field: IMDBFieldKey, value: string) => {
    setEditingField(field)
    setEditValue(value)
  }

  const saveEdit = () => {
    if (editingField) {
      updateField(record.id, editingField, editValue)
    }
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault()
      saveEdit()
    } else if (e.key === "Escape") {
      setEditingField(null)
    }
  }

  const renderField = (field: IMDBFieldKey, label: string, placeholder = "—") => {
    const data = record.fields[field]
    const isEditing = editingField === field

    return (
      <div 
        className={`flex flex-col gap-1.5 p-3 rounded-xl transition-colors cursor-pointer border border-transparent ${data.isEdited ? "bg-blue-50/30" : "hover:bg-slate-50"} hover:border-slate-200`}
        onClick={() => { if (!isEditing) startEdit(field, data.value || "") }}
      >
        <div className="flex justify-between items-start gap-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
          <div className="flex gap-1 flex-shrink-0">
            {data.isEdited ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200/50 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                <PencilSquareIcon className="w-2.5 h-2.5" />
                Edited
              </span>
            ) : (
              <ConfidenceBadge confidence={data.confidence} />
            )}
          </div>
        </div>

        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveEdit}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm bg-white rounded-md shadow-[0_0_0_2px_rgba(59,130,246,0.5)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-900"
          />
        ) : (
          <div className="text-sm font-medium text-slate-900 min-h-[20px]">
            {data.value || <span className="text-slate-400 font-normal italic">{placeholder}</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <div className="flex-1 max-w-[1200px] w-full mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Catalog
          </button>
          
          <button 
            onClick={handleDeleteRecord}
            className="flex items-center gap-2 text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Product
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row relative">
          
          {/* Processing Overlay */}
          {record.status === "processing" && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-semibold text-slate-800">Re-analyzing with new media...</span>
              </div>
            </div>
          )}

          {/* Left Column: Image Gallery Preview */}
          <div className="w-full md:w-5/12 lg:w-1/2 bg-slate-100 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 relative">
            
            <div className="flex-1 min-h-[400px] md:min-h-[600px] relative flex items-center justify-center p-8 bg-slate-50/50 group">
              {activeMedia ? (
                activeMedia.type === "video" ? (
                  <video 
                    src={activeMedia.url} 
                    controls 
                    autoPlay 
                    loop 
                    muted 
                    className="w-full h-full object-contain rounded-xl drop-shadow-md"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={activeMedia.url} 
                    alt="Product preview" 
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-md"
                  />
                )
              ) : (
                <PhotoIcon className="w-24 h-24 text-slate-300" />
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 overflow-x-auto relative z-10">
              {record.media.map((m, i) => (
                <div 
                  key={i} 
                  onClick={() => setActiveMediaIndex(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-colors ${activeMediaIndex === i ? 'border-blue-500 shadow-sm' : 'border-slate-200 hover:border-slate-400 bg-slate-100'}`}
                >
                  {m.type === "video" ? (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      <PlayCircleIcon className="w-6 h-6 text-white opacity-80" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={`Thumbnail ${i}`} className="w-full h-full object-cover mix-blend-multiply" />
                  )}
                </div>
              ))}

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                title="Add new angle or video"
              >
                <PlusIcon className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Media</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleAddMedia} />
            </div>
          </div>

          {/* Right Column: Editable Details */}
          <div className="w-full md:w-7/12 lg:w-1/2 flex flex-col bg-white h-full">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                {record.fields.itemName.value || "Untitled Product"}
              </h1>
              <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
                {record.fields.brand.value || "Unknown Brand"} 
                <span className="text-slate-300">•</span> 
                {record.fields.manufacturer.value || "Unknown Manufacturer"}
              </p>
            </div>

            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Product Attributes</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderField("itemName", "Item Name", "Full catalog name")}
                {renderField("barcode", "Barcode", "e.g. 6033001...")}
                {renderField("manufacturer", "Manufacturer", "e.g. NESTLE")}
                {renderField("brand", "Brand", "e.g. MILO")}
                {renderField("weight", "Weight", "e.g. 400G")}
                {renderField("packagingType", "Packaging", "e.g. TIN")}
                {renderField("country", "Country", "e.g. GHANA")}
                {renderField("variant", "Variant", "e.g. ORIGINAL")}
                {renderField("type", "Type", "e.g. POWDER")}
                {renderField("fragranceFlavor", "Fragrance/Flavor", "e.g. CHOCOLATE")}
                {renderField("promotion", "Promotion", "e.g. BUY NOW GHS33")}
                {renderField("addons", "Addons", "e.g. 5 FREE ENVELOPE")}
                <div className="sm:col-span-2">
                  {renderField("tagline", "Tagline", "e.g. SUPPORTS ENERGY RELEASE")}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
