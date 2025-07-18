"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { ExportDialog } from "@/components/export-dialog"
import { Toaster } from "@/components/ui/toaster"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Mock export data
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
      { month: "Bře", accuracy: 97.8 },
      { month: "Dub", accuracy: 98.2 },
      { month: "Kvě", accuracy: 98.5 },
      { month: "Čer", accuracy: 98.7 },
    ],
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen}
        onExportClick={() => setExportDialogOpen(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        data={exportData}
      />
      
      <Toaster />
    </div>
  )
}
