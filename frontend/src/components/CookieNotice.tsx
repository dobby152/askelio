'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Cookie, Settings } from 'lucide-react'

export default function CookieNotice() {
  const [showNotice, setShowNotice] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('cookie-consent')
      if (!consent) {
        setShowNotice(true)
      }
    }
  }, [])

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now()
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent', JSON.stringify(consent))
    }
    setShowNotice(false)
  }

  const acceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: Date.now()
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent', JSON.stringify(consent))
    }
    setShowNotice(false)
    setShowSettings(false)
  }

  const rejectAll = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now()
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cookie-consent', JSON.stringify(consent))
    }
    setShowNotice(false)
  }

  if (!showNotice) return null

  return (
    <>
      {/* Cookie Notice */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Cookie className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Používáme cookies</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Používáme cookies pro zlepšení funkčnosti webu, analýzu návštěvnosti a personalizaci obsahu. 
                  Více informací najdete v našich{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                    zásadách ochrany soukromí
                  </Link>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={acceptAll}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Přijmout vše
                  </button>
                  <button
                    onClick={rejectAll}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    Odmítnout vše
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Nastavení
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowNotice(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Nastavení cookies</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Nezbytné cookies</h3>
                    <div className="bg-gray-200 rounded-full p-1">
                      <div className="bg-blue-600 w-5 h-5 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tyto cookies jsou nezbytné pro základní funkčnost webu a nelze je vypnout.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Analytické cookies</h3>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.analytics ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Pomáhají nám pochopit, jak návštěvníci používají náš web, abychom ho mohli zlepšovat.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Marketingové cookies</h3>
                    <button
                      onClick={() => setPreferences(prev => ({ ...prev, marketing: !prev.marketing }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        preferences.marketing ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          preferences.marketing ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    Používají se pro personalizaci reklam a měření jejich efektivity.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={acceptSelected}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Uložit nastavení
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Zrušit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
