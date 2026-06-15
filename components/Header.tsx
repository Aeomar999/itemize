"use client"

import { useItemizeStore } from "@/store/useItemizeStore"
import { TrashIcon, ViewColumnsIcon } from "@heroicons/react/24/outline"

export function Header() {
  const clearSession = useItemizeStore(state => state.clearSession)
  const records = useItemizeStore(state => state.records)

  return (
    <header className="sticky top-0 z-50 w-full bg-white px-6 py-4 flex items-center justify-between border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center">
          <ViewColumnsIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
            Itemize
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Image-to-IMDB</p>
        </div>
      </div>

      {records.length > 0 && (
        <button
          onClick={clearSession}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          Clear Session
        </button>
      )}
    </header>
  )
}
