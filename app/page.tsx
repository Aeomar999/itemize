"use client"

import { Header } from "@/components/Header"
import { UploadZone } from "@/components/UploadZone"
import { UploadQueue } from "@/components/UploadQueue"
import { ResultsTable } from "@/components/ResultsTable"
import { useItemizeStore } from "@/store/useItemizeStore"

export default function Home() {
  const records = useItemizeStore(state => state.records)

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col px-4">
        <UploadZone isCompressed={records.length > 0} />
        <UploadQueue />
        <ResultsTable />
      </div>
    </main>
  )
}
