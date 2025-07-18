"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { ChartsSection } from "@/components/charts-section"
import { UploadArea } from "@/components/upload-area"
import { DocumentsTable } from "@/components/documents-table"

import { Toaster } from "@/components/ui/toaster"
// Přidej import pro ExportDialog a export data
import { ExportDialog } from "@/components/export-dialog"

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Přidej state pro export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Přidej mock export data
  const exportData = {
    documents: [
      {
        id: "1",
        name: "Faktura_2024_001.pdf",
        type: "pdf" as const,
        status: "completed" as const,
        accuracy: 98.5,
        processedAt: "2024-01-15 14:30",
        size: "2.4 MB",
        pages: 3,
      },
      // ... další dokumenty
    ],
    statistics: {
      processedDocuments: 2847,
      timeSaved: 156.2,
      accuracy: 98.7,
      remainingCredits: 2450,
    },
    monthlyUsage: [
      { month: "Led", documents: 245 },
      { month: "Úno", documents: 312 },
      { month: "Bře", documents: 189 },
      { month: "Dub", documents: 398 },
      { month: "Kvě", documents: 456 },
      { month: "Čer", documents: 523 },
    ],
    accuracyTrend: [
      { month: "Led", accuracy: 96.2 },
      { month: "Úno", accuracy: 97.1 },
      { month: "Bře", accuracy: 96.8 },
      { month: "Dub", accuracy: 98.2 },
      { month: "Kvě", accuracy: 98.5 },
      { month: "Čer", accuracy: 98.7 },
    ],
    documentTypes: [
      { name: "Faktury", value: 45 },
      { name: "Smlouvy", value: 25 },
      { name: "Doklady", value: 20 },
      { name: "Ostatní", value: 10 },
    ],
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Aktualizuj Sidebar komponentu aby předávala onExportClick */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} onExportClick={() => setExportDialogOpen(true)} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header setSidebarOpen={setSidebarOpen} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vítejte zpět v Askelio OCR</p>
              </div>

              <StatsCards />

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <ChartsSection />
                  <DocumentsTable />
                </div>

                <div className="space-y-6">
                  <UploadArea />
                </div>
              </div>
            </div>
          </main>
        </div>
        {/* Přidej ExportDialog před closing </div> tagu */}
        <ExportDialog
          data={exportData}
          trigger={<div style={{ display: "none" }} />}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      </div>
      <Toaster />
    </>
  )
}
