"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100"
        aria-label={isOpen ? "Zavřít menu" : "Otevřít menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <nav className="px-4 py-4 space-y-4">
            <a
              href="#features"
              className="block py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Funkce
            </a>
            <a
              href="#how-it-works"
              className="block py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Jak to funguje
            </a>
            <a
              href="#pricing"
              className="block py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Ceník
            </a>
            <a
              href="#testimonials"
              className="block py-3 px-4 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              onClick={() => setIsOpen(false)}
            >
              Reference
            </a>
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 h-11 bg-transparent"
                onClick={() => setIsOpen(false)}
                asChild
              >
                <a href="/auth/login">Přihlásit se</a>
              </Button>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11" onClick={() => setIsOpen(false)} asChild>
                <a href="/auth/register">Vyzkoušet zdarma</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
