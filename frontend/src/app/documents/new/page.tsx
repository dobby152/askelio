"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { UploadArea } from "@/components/upload-area"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewDocumentPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/documents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nový dokument</h1>
            <p className="text-gray-600 dark:text-gray-400">Nahrajte nový dokument k zpracování</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <UploadArea />
        </div>
      </div>
    </DashboardLayout>
  )
}
