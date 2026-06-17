"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { UploadZone } from "@/components/UploadZone"
import { UploadQueue } from "@/components/UploadQueue"
import { ResultsTable } from "@/components/ResultsTable"
import { useItemizeStore } from "@/store/useItemizeStore"

import { PullToRefresh } from "@/components/PullToRefresh"

export default function Home() {
  const records = useItemizeStore(state => state.records)
  const isHydrated = useItemizeStore(state => state.isHydrated)
  const fetchRecords = useItemizeStore(state => state.fetchRecords)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!isHydrated) {
      fetchRecords().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [isHydrated, fetchRecords])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleRefresh = async () => {
    await fetchRecords()
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <main className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        
        <div className="flex-1 flex flex-col px-4">
          <UploadZone isCompressed={records.length > 0} />
          <UploadQueue />
          <ResultsTable />
        </div>
      </main>
    </PullToRefresh>
  )
}
