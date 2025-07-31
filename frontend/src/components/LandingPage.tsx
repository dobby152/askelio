'use client'

import { useState } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MobileMenu } from "@/components/mobile-menu"
import { LoadingButton } from "@/components/loading-button"
import {
  FileText,
  CreditCard,
  Database,
  Download,
  Clock,
  Shield,
  Users,
  CheckCircle,
  ArrowRight,
  Scan,
  Brain,
  Star,
  Upload,
  Send,
  ChevronDown,
  TrendingUp,
  Award,
  Zap,
} from "lucide-react"

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/askelio-logo.svg"
                alt="Askelio Logo"
                width={40}
                height={40}
                className="h-10 w-auto"
                priority
              />
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                Askelio
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8 lg:space-x-10">
              <a
                href="#features"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                tabIndex={0}
              >
                Funkce
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                tabIndex={0}
              >
                Jak to funguje
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                tabIndex={0}
              >
                Ceník
              </a>
              <a
                href="#testimonials"
                className="text-gray-600 hover:text-blue-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                tabIndex={0}
              >
                Reference
              </a>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent h-11 min-w-[44px]"
                aria-label="Přihlásit se do účtu"
              >
                Přihlásit se
              </Button>
              <LoadingButton
                className="bg-blue-600 hover:bg-blue-700 text-white h-11 min-w-[44px]"
                size="default"
              >
                Vyzkoušet zdarma
              </LoadingButton>
            </nav>

            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Hero Section with Grid Pattern */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white relative overflow-hidden">
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-[0.02]" aria-hidden="true">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, #1e3a8a 1px, transparent 1px),
                linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)
              `,
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 sm:mb-8 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm sm:text-base">
              🏢 Firemní systém pro automatizaci dokumentů s AI
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 leading-tight tracking-tight">
              Firemní systém pro{" "}
              <span className="text-blue-600">automatizaci dokumentů</span>{" "}
              s AI
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-4 sm:px-0">
              Kompletní řešení pro týmy - správa zaměstnanců, schvalovací workflow, pokročilé analýzy a{" "}
              <strong className="font-semibold text-gray-900">automatické zpracování dokumentů</strong> s 99% přesností.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 sm:px-0">
              <LoadingButton
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 h-12 sm:h-auto min-w-[44px] order-1"
                showArrow
                onClick={() => window.location.href = '/company/register'}
              >
                Začít zdarma - bez karty
              </LoadingButton>
              <LoadingButton
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 bg-transparent h-12 sm:h-auto min-w-[44px] order-2"
              >
                Sledovat demo (2 min)
              </LoadingButton>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center mb-12 sm:mb-16 lg:mb-20 px-4 sm:px-0">
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">15h</div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">Úspora týdně</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 mb-1 sm:mb-2">95%</div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">Méně chyb</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">5 min</div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">Nastavení</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 mb-1 sm:mb-2">1200+</div>
                <div className="text-sm sm:text-base text-gray-600 font-medium">Spokojených firem</div>
              </div>
            </div>

            {/* Trusted by */}
            <div className="text-center px-4 sm:px-0">
              <p className="text-gray-500 mb-6 sm:mb-8 font-medium text-base sm:text-lg">Důvěřuje nám přes 1200 českých firem</p>
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 lg:gap-12 opacity-60">
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">POHODA</div>
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">MONEY S3</div>
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">HELIOS</div>
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">ABRA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge className="mb-4 sm:mb-6 bg-blue-50 text-blue-700 border-blue-200">
              ⚡ Funkce
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Vše co potřebujete pro automatizaci
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Pokročilé AI technologie pro zpracování dokumentů s maximální přesností a rychlostí
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Scan className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">OCR Rozpoznávání</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">99% přesnost při rozpoznávání textu z faktur, účtenek a dokumentů</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">AI Zpracování</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Inteligentní extrakce dat s automatickou kategorizací a validací</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">ERP Integrace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Přímé propojení s Pohoda, Money S3, Helios a dalšími systémy</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Export Formáty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">CSV, JSON, ISDOC, XML - exportujte data v libovolném formátu</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Rychlé Zpracování</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Dokumenty zpracovány do 30 sekund s okamžitými výsledky</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Bezpečnost</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">GDPR compliance, AES-256 šifrování, EU datacentra</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Týmová Spolupráce</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Správa zaměstnanců, role a oprávnění pro celý tým</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Schvalovací Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Automatické schvalování dokumentů podle firemních pravidel</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">Pokročilé Analýzy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Detailní reporty, trendy a insights pro lepší rozhodování</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge className="mb-4 sm:mb-6 bg-emerald-50 text-emerald-700 border-emerald-200">
              💬 Reference
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Co říkají naši zákazníci
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Přečtěte si zkušenosti firem, které už používají Askelio pro automatizaci účetnictví
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
            <Card className="bg-gray-50 border-gray-200 hover:bg-white hover:shadow-lg transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "Askelio nám ušetřilo 12 hodin týdně. Rozpoznávání je neuvěřitelně přesné a integrace s Pohoda byla hračka."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    JP
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Jana Procházková</div>
                    <div className="text-sm text-gray-600">CFO, FinanceMax</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200 hover:bg-white hover:shadow-lg transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "Skvělá podpora pro malé firmy. Cena odpovídá hodnotě, kterou dostáváme. Doporučuji všem účetním."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    MK
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Michal Krejčí</div>
                    <div className="text-sm text-gray-600">Zakladatel, MK Consulting</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50 border-gray-200 hover:bg-white hover:shadow-lg transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "AI technologie je na špičkové úrovni. Rozpoznává i ručně psané poznámky a složité faktury."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                    LH
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Lucie Horáková</div>
                    <div className="text-sm text-gray-600">Analytička, DataCorp</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Social Proof Stats */}
          <div className="text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">1200+</div>
                <div className="text-sm text-gray-600">Aktivních firem</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">99%</div>
                <div className="text-sm text-gray-600">Přesnost OCR</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">15h</div>
                <div className="text-sm text-gray-600">Úspora týdně</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">4.9/5</div>
                <div className="text-sm text-gray-600">Hodnocení</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20">
            <Badge className="mb-4 sm:mb-6 bg-purple-50 text-purple-700 border-purple-200">
              💰 Ceník pro firmy
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Plány pro každou velikost firmy
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Vyberte si plán podle počtu zaměstnanců a objemu dokumentů. Všechny plány zahrnují pokročilé AI zpracování.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 sm:gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">ZDARMA</CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">0 Kč</span>
                  <span className="text-gray-600 ml-2">/ měsíc</span>
                </div>
                <p className="text-sm text-gray-600">Pro testování a malé firmy</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">2 zaměstnanci</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">50 dokumentů/měsíc</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">1 GB úložiště</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Základní podpora</span>
                  </li>
                </ul>
                <LoadingButton
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                  onClick={() => window.location.href = '/company/register'}
                >
                  Začít zdarma
                </LoadingButton>
              </CardContent>
            </Card>

            {/* Basic Plan */}
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">ZÁKLADNÍ</CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">990 Kč</span>
                  <span className="text-gray-600 ml-2">/ měsíc</span>
                </div>
                <p className="text-sm text-gray-600">Pro malé firmy s pokročilými funkcemi</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">5 zaměstnanců</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">200 dokumentů/měsíc</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">5 GB úložiště</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Schvalovací workflow</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">E-mailová podpora</span>
                  </li>
                </ul>
                <LoadingButton
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = '/company/register'}
                >
                  Vybrat plán
                </LoadingButton>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="bg-white border-2 border-purple-500 hover:shadow-lg transition-shadow relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-3 py-1">NEJPOPULÁRNĚJŠÍ</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">PREMIUM</CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">2 990 Kč</span>
                  <span className="text-gray-600 ml-2">/ měsíc</span>
                </div>
                <p className="text-sm text-gray-600">Pro střední firmy s pokročilými analýzami</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">20 zaměstnanců</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">1 000 dokumentů/měsíc</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">20 GB úložiště</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Pokročilé analýzy</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">API přístup</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Prioritní podpora</span>
                  </li>
                </ul>
                <LoadingButton
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => window.location.href = '/company/register'}
                >
                  Vybrat plán
                </LoadingButton>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">ENTERPRISE</CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">9 990 Kč</span>
                  <span className="text-gray-600 ml-2">/ měsíc</span>
                </div>
                <p className="text-sm text-gray-600">Pro velké firmy s neomezenými možnostmi</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Neomezení zaměstnanci</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Neomezené dokumenty</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Neomezené úložiště</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Vlastní integrace</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Dedikovaný support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">SLA 99.9%</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  Kontaktovat prodej
                </LoadingButton>
              </CardContent>
            </Card>
          </div>

          {/* Additional pricing info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Všechny plány zahrnují 14denní zkušební období zdarma
            </p>
            <p className="text-sm text-gray-500">
              Roční platba = 2 měsíce zdarma • Bez závazků • Zrušení kdykoli
            </p>
          </div>
        </div>
      </section>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">E-mailová podpora</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">CSV export</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Začít hned
                </LoadingButton>
              </CardContent>
            </Card>

            <Card className="bg-white border-blue-200 ring-2 ring-blue-600 relative hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-4 py-1">Nejpopulárnější</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">PROFI</CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">700 Kč</span>
                  <span className="text-gray-600 ml-2">/ 500 kreditů</span>
                </div>
                <p className="text-sm text-green-600 font-medium">Úspora 30%</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">500 kreditů</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Premium OCR + AI</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Prioritní podpora</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Všechny exporty</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">ERP integrace</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Začít hned
                </LoadingButton>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold text-gray-900 mb-2">BUSINESS</CardTitle>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">1250 Kč</span>
                  <span className="text-gray-600 ml-2">/ 1000 kreditů</span>
                </div>
                <p className="text-sm text-green-600 font-medium">Úspora 38%</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">1000 kreditů</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Premium OCR + AI</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Dedikovaná podpora</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">API přístup</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">Vlastní integrace</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Kontaktovat prodej
                </LoadingButton>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-600">
              Všechny plány zahrnují 14denní zkušební období zdarma • Bez závazků • Zrušte kdykoli
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 sm:mb-16 lg:mb-20">
              <Badge className="mb-4 sm:mb-6 bg-orange-50 text-orange-700 border-orange-200">
                ❓ FAQ
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
                Často kladené otázky
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
                Odpovědi na nejčastější otázky o Askelio a automatizaci zpracování dokumentů
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === 0 ? null : 0)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    Jak přesné je OCR rozpoznávání?
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-all duration-300 ${
                      openFaq === 0 ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {openFaq === 0 && (
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      Naše OCR technologie dosahuje přesnosti 99% při rozpoznávání textu z faktur a dokumentů.
                      Pro ručně psané poznámky je přesnost 85-90%. Používáme kombinaci Tesseract a premium AI modelů.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    Které ERP systémy podporujete?
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-all duration-300 ${
                      openFaq === 1 ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {openFaq === 1 && (
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      Podporujeme všechny hlavní ERP systémy včetně Pohoda, Money S3, Helios, Abra a další.
                      Můžeme také vytvořit vlastní integraci podle vašich potřeb.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    Jak dlouho trvá zpracování dokumentu?
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-all duration-300 ${
                      openFaq === 2 ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {openFaq === 2 && (
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      Standardní faktura je zpracována do 30 sekund. Složitější dokumenty mohou trvat až 2 minuty.
                      Výsledky dostanete e-mailem nebo přes API v reálném čase.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    Jak zabezpečujete nahrané dokumenty?
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-all duration-300 ${
                      openFaq === 3 ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {openFaq === 3 && (
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      Všechny dokumenty jsou šifrovány AES-256, ukládány v EU datacentrech a automaticky mazány po 30 dnech.
                      Splňujeme GDPR a ISO 27001 standardy.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === 4 ? null : 4)}
                  className="w-full px-6 sm:px-8 py-6 text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    Můžu zrušit předplatné kdykoli?
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-all duration-300 ${
                      openFaq === 4 ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {openFaq === 4 && (
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      Ano, můžete zrušit kdykoli bez poplatků. Kredity nevyprší a můžete je použít i po zrušení.
                      Žádné dlouhodobé závazky ani skryté poplatky.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Začněte automatizovat ještě dnes
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 leading-relaxed">
              Připojte se k více než 1200 firmám, které už ušetřily tisíce hodin díky Askelio
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <LoadingButton
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 py-4 h-12 sm:h-auto"
                onClick={() => window.location.href = '/company/register'}
              >
                Začít zdarma - bez karty
              </LoadingButton>
              <LoadingButton
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4 h-12 sm:h-auto bg-transparent"
              >
                Rezervovat demo
              </LoadingButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/askelio-logo.svg"
                  alt="Askelio Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <div className="text-xl font-bold">Askelio</div>
              </div>
              <p className="text-gray-400 mb-4 leading-relaxed">
                OCR platforma pro automatizaci zpracování faktur a dokumentů s AI technologií.
              </p>
              <div className="text-gray-400 text-sm space-y-1">
                <p>Askela s.r.o.</p>
                <p>IČO: 26757125, DIČ: CZ26757125</p>
                <p>info@askela.cz</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Funkce</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Ceník</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reference</a></li>
                <li><a href="/auth/register" className="hover:text-white transition-colors">Registrace</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Společnost</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white transition-colors">O nás</a></li>
                <li><a href="/contact" className="hover:text-white transition-colors">Kontakt</a></li>
                <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Právní</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/privacy" className="hover:text-white transition-colors">Ochrana soukromí</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Podmínky použití</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">© 2025 Askelio. Všechna práva vyhrazena.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

