"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { ChartsSection } from "@/components/charts-section"
import { DocumentWorkspace } from "@/components/document-workspace"
import { MultilayerOCRStatus } from "@/components/dashboard/MultilayerOCRStatus"
import { MultilayerOCRTester } from "@/components/dashboard/MultilayerOCRTester"

import { Toaster } from "@/components/ui/toaster"
// Přidej import pro ExportDialog a export data
import { ExportDialog } from "@/components/export-dialog"

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Přidej state pro export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Export data - will be fetched from API
  const exportData = {
    documents: [],
    statistics: {
      processedDocuments: 0,
      timeSaved: 0,
      accuracy: 0,
      remainingCredits: 0,
    },
    monthlyUsage: [],
    accuracyTrend: [],
    documentTypes: [],
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
                </div>
                <div className="space-y-6">
                  <MultilayerOCRStatus />
                  <MultilayerOCRTester />
                </div>
              </div>

              {/* Document Workspace with Preview */}
              <div className="h-[600px]">
                <DocumentWorkspace />
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
