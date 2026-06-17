"use client"

import { useState } from "react"
import { useItemizeStore } from "@/store/useItemizeStore"
import { TableRow } from "./TableRow"
import { ProductCard } from "./ProductCard"
import { EmptyState } from "./EmptyState"
import { exportRecords } from "@/lib/export"
import { DocumentArrowDownIcon, TableCellsIcon, Squares2X2Icon, ListBulletIcon } from "@heroicons/react/24/outline"

export function ResultsTable() {
  const records = useItemizeStore(state => state.records)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  if (records.length === 0) return <EmptyState />

  const doneRecords = records.filter(r => r.status === "done")

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-8 mb-16 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Extracted Records</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full sm:w-auto self-start sm:self-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "table" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
            >
              <ListBulletIcon className="w-4 h-4" />
              Table
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => exportRecords(doneRecords, "csv")}
              disabled={doneRecords.length === 0}
              className="flex flex-1 sm:flex-none justify-center sm:justify-start items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <DocumentArrowDownIcon className="w-4 h-4 text-slate-500" />
              itemize.csv
            </button>
            <button
              onClick={() => exportRecords(doneRecords, "xlsx")}
              disabled={doneRecords.length === 0}
              className="flex flex-1 sm:flex-none justify-center sm:justify-start items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 shadow-md shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <TableCellsIcon className="w-4 h-4 text-slate-300" />
              itemize.xlsx
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {records.map(record => (
            <ProductCard key={record.id} record={record} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
          <div className="overflow-x-auto max-h-[75vh]">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-max border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-md text-slate-400 font-bold tracking-wider text-[10px] uppercase shadow-sm">
                <tr>
                  <th className="px-4 py-4 sticky left-0 z-30 bg-white/90 backdrop-blur-md border-r border-b border-slate-100 shadow-[1px_0_0_rgb(0,0,0,0.03)]">Image</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[260px]">Item Name</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[140px]">Barcode</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[180px]">Manufacturer</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[120px]">Brand</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[90px]">Weight</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[130px]">Packaging</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[110px]">Country</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[100px]">Variant</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[120px]">Type</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[130px]">Fragrance/Flavor</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[140px]">Promotion</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[120px]">Addons</th>
                  <th className="px-4 py-4 border-b border-slate-100 min-w-[180px]">Tagline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(record => (
                  <TableRow key={record.id} record={record} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
