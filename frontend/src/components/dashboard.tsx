"use client"

import { useState, Suspense } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { StatsCards } from "@/components/stats-cards"
import { ChartsSection } from "@/components/charts-section"
import { DocumentWorkspace } from "@/components/document-workspace"
import { Toaster } from "@/components/ui/toaster"
import { ExportDialog } from "@/components/export-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Loading component for better UX
function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Načítání...</span>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Export data - will be fetched from API in production
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
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900" data-testid="dashboard-container">
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

              <Suspense fallback={<LoadingCard />}>
                <StatsCards />
              </Suspense>

              <div className="grid grid-cols-1 gap-6">
                <Suspense fallback={<LoadingCard />}>
                  <ChartsSection />
                </Suspense>
              </div>

              {/* Document Workspace with Preview */}
              <div className="h-[600px]">
                <Suspense fallback={<LoadingCard />}>
                  <DocumentWorkspace />
                </Suspense>
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
