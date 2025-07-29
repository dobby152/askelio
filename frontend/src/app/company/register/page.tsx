'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CompanyRegistration from '@/components/company/CompanyRegistration'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CompanyRegisterPage() {
  const router = useRouter()

  const handleRegistrationComplete = (companyId: string) => {
    // Redirect to dashboard after successful company creation
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Askelio</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zpět na hlavní stránku
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/login">
                  Přihlásit se
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        <CompanyRegistration onComplete={handleRegistrationComplete} />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Askelio. Všechna práva vyhrazena.</p>
            <div className="mt-2 space-x-4">
              <Link href="/privacy" className="hover:text-blue-600">
                Ochrana osobních údajů
              </Link>
              <Link href="/terms" className="hover:text-blue-600">
                Obchodní podmínky
              </Link>
              <Link href="/support" className="hover:text-blue-600">
                Podpora
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
