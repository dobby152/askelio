// Navbar component
'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { LogOut, User, CreditCard } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-blue-600">
            Askelio
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/documents"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Dokumenty
                </Link>
                <Link
                  href="/credits"
                  className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <CreditCard className="w-4 h-4 mr-1" />
                  Kredity
                </Link>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={signOut}
                    data-testid="logout-button"
                    className="flex items-center text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Přihlášení
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Registrace
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
