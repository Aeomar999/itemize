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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Extracted Records</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => exportRecords(doneRecords, "csv")}
            disabled={doneRecords.length === 0}
            className="flex flex-1 sm:flex-none justify-center sm:justify-start items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DocumentArrowDownIcon className="w-4 h-4 text-slate-500" />
            predictions.csv
          </button>
          <button
            onClick={() => exportRecords(doneRecords, "xlsx")}
            disabled={doneRecords.length === 0}
            className="flex flex-1 sm:flex-none justify-center sm:justify-start items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 shadow-md shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <TableCellsIcon className="w-4 h-4 text-slate-300" />
            predictions.xlsx
          </button>
        </div>
      </div>

      <div className="sm:bg-white sm:rounded-xl sm:shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:border sm:border-slate-100 sm:overflow-hidden relative">
        <div className="overflow-x-visible sm:overflow-x-auto sm:max-h-[75vh]">
          <table className="w-full text-left text-sm sm:whitespace-nowrap sm:min-w-max sm:border-separate sm:border-spacing-0 flex flex-col sm:table">
            <thead className="hidden sm:table-header-group sticky top-0 z-20 bg-white/80 backdrop-blur-md text-slate-400 font-bold tracking-wider text-[10px] uppercase shadow-sm">
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
            <tbody className="flex flex-col gap-4 sm:gap-0 sm:table-row-group sm:divide-y sm:divide-slate-100">
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
