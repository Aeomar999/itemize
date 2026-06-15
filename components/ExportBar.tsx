"use client"

import { useItemizeStore } from "@/store/useItemizeStore"
import { exportRecords } from "@/lib/export"
import { DocumentArrowDownIcon, TableCellsIcon } from "@heroicons/react/24/outline"

export function ExportBar() {
  const records = useItemizeStore(state => state.records)

  // Only show if we have processed any records
  if (records.length === 0) return null

  const doneRecords = records.filter(r => r.status === "done")
  const processingCount = records.length - doneRecords.length

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="pointer-events-auto glass-dark rounded-full px-6 py-4 flex items-center justify-between gap-8 shadow-2xl animate-fade-in-up">
        
        <div className="flex items-center gap-3 text-slate-200">
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-wide">
              {doneRecords.length} / {records.length} Processed
            </span>
            {processingCount > 0 && (
              <span className="text-xs text-indigo-300 font-medium animate-pulse">
                {processingCount} remaining...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-700/50 pl-6">
          <button 
            onClick={() => exportRecords(doneRecords, "csv")}
            disabled={doneRecords.length === 0}
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-600/50 hover:border-slate-500/80 active:scale-95"
          >
            <DocumentArrowDownIcon className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 group-hover:-translate-y-0.5 transition-transform" />
            Export CSV
          </button>
          
          <button 
            onClick={() => exportRecords(doneRecords, "xlsx")}
            disabled={doneRecords.length === 0}
            className="group relative flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-semibold rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <TableCellsIcon className="w-5 h-5 text-indigo-200 group-hover:text-white group-hover:-translate-y-0.5 transition-transform" />
            Export Excel
          </button>
        </div>
        
      </div>
    </div>
  )
}
