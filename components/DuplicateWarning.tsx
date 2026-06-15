"use client"

import { ExclamationTriangleIcon, ArrowRightIcon } from "@heroicons/react/24/solid"

interface Props {
  duplicateStatus?: "exact" | "possible" | "none"
  duplicateOf?: string | null
}

export function DuplicateWarning({ duplicateStatus, duplicateOf }: Props) {
  if (!duplicateStatus || duplicateStatus === "none") return null

  const isExact = duplicateStatus === "exact"
  
  const handleJump = () => {
    if (!duplicateOf) return
    const el = document.getElementById(duplicateOf)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      // Apply temporary highlight
      el.classList.add("ring-2", "ring-yellow-400", "bg-yellow-50")
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-yellow-400", "bg-yellow-50")
      }, 1500)
    }
  }

  return (
    <div className={`px-4 py-2 flex items-center justify-between text-xs font-medium ${
      isExact ? "bg-red-50 text-red-700 border-y border-red-100" : "bg-yellow-50 text-yellow-700 border-y border-yellow-100"
    }`}>
      <div className="flex items-center gap-1.5">
        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
        <span>
          {isExact 
            ? "Duplicate barcode — matches an existing row" 
            : "Possible duplicate — same brand & weight"}
        </span>
      </div>

      {duplicateOf && (
        <button 
          onClick={handleJump}
          className="flex items-center gap-1 text-[11px] uppercase tracking-wide hover:underline focus:outline-none"
        >
          View match
          <ArrowRightIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}
