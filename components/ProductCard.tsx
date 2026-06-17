import Link from "next/link"
import { IMDBRecord } from "@/types/imdb"
import { PhotoIcon } from "@heroicons/react/24/outline"
import { CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from "@heroicons/react/20/solid"

interface ProductCardProps {
  record: IMDBRecord
}

export function ProductCard({ record }: ProductCardProps) {
  const imageUrl = record.media[0]?.url
  const itemName = record.fields.itemName.value || "Untitled Product"
  const typeField = record.fields.type

  // Only show category if confidence > 85% and it exists
  const showCategory = typeField.value && typeField.confidence > 0.85
  const category = typeField.value

  return (
    <Link 
      href={`/product/${record.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-[0_2px_10px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all hover:-translate-y-1 relative"
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 z-10">
        {record.status === "processing" ? (
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
        ) : record.status === "error" ? (
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 drop-shadow-sm bg-white rounded-full" />
        ) : record.needsReview ? (
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 drop-shadow-sm bg-white rounded-full" />
        ) : (
          <CheckCircleIcon className="w-5 h-5 text-emerald-500 drop-shadow-sm bg-white rounded-full" />
        )}
      </div>

      {/* Image Container (Square) */}
        <div className="relative aspect-square w-full bg-slate-100 p-6 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={imageUrl} 
              alt={record.fields.itemName.value || "Product image"} 
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm"
            />
          ) : (
            <PhotoIcon className="w-12 h-12 text-slate-300" />
          )}

          {record.media.length > 1 && (
            <div className="absolute top-3 right-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
              +{record.media.length - 1} Media
            </div>
          )}
        </div>

      {/* Details */}
      <div className="p-4 flex flex-col flex-1 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {itemName}
        </h3>
        
        {showCategory && (
          <p className="text-xs text-slate-500 mt-1.5 font-medium uppercase tracking-wider line-clamp-1">
            {category}
          </p>
        )}
      </div>
    </Link>
  )
}
