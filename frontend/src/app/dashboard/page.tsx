'use client'

import { useAuth } from '@/components/AuthProvider'
import { Dashboard } from '@/components/dashboard'

export default function DashboardPage() {
  const { user } = useAuth()

  if (!user) {
    return null // This should be handled by auth middleware
  }

  return <Dashboard />
}
