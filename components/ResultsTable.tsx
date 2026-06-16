"use client"

import { useItemizeStore } from "@/store/useItemizeStore"
import { TableRow } from "./TableRow"
import { EmptyState } from "./EmptyState"
import { exportRecords } from "@/lib/export"
import { DocumentArrowDownIcon, TableCellsIcon } from "@heroicons/react/24/outline"

export function ResultsTable() {
  const records = useItemizeStore(state => state.records)

  if (records.length === 0) return <EmptyState />

  const doneRecords = records.filter(r => r.status === "done")

  return (
    <div className="w-full max-w-[1600px] mx-auto mt-8 mb-16 px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Extracted Records</h2>
        <div className="flex gap-2">
          <button
            onClick={() => exportRecords(doneRecords, "csv")}
            disabled={doneRecords.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 text-sm font-medium rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
            predictions.csv
          </button>
          <button
            onClick={() => exportRecords(doneRecords, "xlsx")}
            disabled={doneRecords.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <TableCellsIcon className="w-4 h-4" />
            predictions.xlsx
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold tracking-wide text-xs uppercase">
              <tr>
                <th className="px-4 py-3 sticky left-0 z-10 bg-slate-50 border-r border-slate-200">Image</th>
                <th className="px-4 py-3 min-w-[260px]">Item Name</th>
                <th className="px-4 py-3 min-w-[140px]">Barcode</th>
                <th className="px-4 py-3 min-w-[180px]">Manufacturer</th>
                <th className="px-4 py-3 min-w-[120px]">Brand</th>
                <th className="px-4 py-3 min-w-[90px]">Weight</th>
                <th className="px-4 py-3 min-w-[130px]">Packaging</th>
                <th className="px-4 py-3 min-w-[110px]">Country</th>
                <th className="px-4 py-3 min-w-[100px]">Variant</th>
                <th className="px-4 py-3 min-w-[120px]">Type</th>
                <th className="px-4 py-3 min-w-[130px]">Fragrance/Flavor</th>
                <th className="px-4 py-3 min-w-[140px]">Promotion</th>
                <th className="px-4 py-3 min-w-[120px]">Addons</th>
                <th className="px-4 py-3 min-w-[180px]">Tagline</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
    </div>
  )
}
