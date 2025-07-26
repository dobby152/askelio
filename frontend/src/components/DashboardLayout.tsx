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

  // Empty export data - will be populated from real API data
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
