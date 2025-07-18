"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { StatsCards } from "@/components/stats-cards"
import { ChartsSection } from "@/components/charts-section"

export default function StatisticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistiky</h1>
          <p className="text-gray-600 dark:text-gray-400">Přehled výkonnosti a využití</p>
        </div>

        <StatsCards />
        <ChartsSection />
      </div>
    </DashboardLayout>
  )
}
