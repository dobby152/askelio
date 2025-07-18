"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { DocumentsTable } from "@/components/documents-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dokumenty</h1>
            <p className="text-gray-600 dark:text-gray-400">Správa všech vašich dokumentů</p>
          </div>
          <Link href="/documents/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nový dokument
            </Button>
          </Link>
        </div>

        <DocumentsTable />
      </div>
    </DashboardLayout>
  )
}
