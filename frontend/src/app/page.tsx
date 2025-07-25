"use client"

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

export default function Home() {
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
              <span className="text-xl sm:text-2xl font-bold text-gray-900">Askelio</span>
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
                asChild
              >
                <a href="/auth/login">Přihlásit se</a>
              </Button>
              <LoadingButton className="bg-blue-600 hover:bg-blue-700 text-white h-11 min-w-[44px]" size="default" asChild>
                <a href="/auth/register">Vyzkoušet zdarma</a>
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
        <div className="absolute inset-0 opacity-[0.08]" aria-hidden="true">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(to right, #1e3a8a 1px, transparent 1px),
                linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <Badge className="mb-6 sm:mb-8 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm sm:text-base">
              🚀 Automatizované zpracování faktur a účtenek s AI
            </Badge>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 leading-tight tracking-tight">
              Ušetřete až <span className="text-blue-600">15 hodin týdně</span> na účetnictví
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-4 sm:px-0">
              Askelio automaticky zpracuje vaše faktury a účtenky s{" "}
              <strong className="font-semibold text-gray-900">99% přesností</strong>. Snižte chyby o 95% a integrujte se
              s českými ERP systémy během 5 minut.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 sm:px-0">
              <LoadingButton
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 h-12 sm:h-auto min-w-[44px] order-1"
                showArrow
                asChild
              >
                <a href="/auth/register">Začít zdarma - bez karty</a>
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
              <p className="text-gray-500 mb-6 sm:mb-8 font-medium text-base sm:text-lg">
                Důvěřuje nám přes 1200 českých firem
              </p>
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 lg:gap-12 opacity-60">
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">
                  POHODA
                </div>
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">
                  MONEY S3
                </div>
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">
                  HELIOS
                </div>
                <div className="bg-gray-100 rounded-lg px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 font-bold text-gray-600 text-sm sm:text-base lg:text-lg">
                  ABRA
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <Badge className="mb-6 sm:mb-8 bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-2 text-sm sm:text-base">
              Jak to funguje
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4 sm:px-0">
              Zpracování faktur za <span className="text-blue-600">3 jednoduché kroky</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 sm:px-0">
              Naše AI technologie zpracuje vaše dokumenty rychleji než kdy dříve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16 max-w-6xl mx-auto">
            <div className="text-center group">
              <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 hover:bg-blue-700 transition-colors">
                <Upload className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 text-white" />
              </div>
              <div className="bg-blue-100 rounded-full w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-blue-600 font-bold text-base sm:text-lg">1</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Nahrajte dokument</h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg px-4 sm:px-0">
                Jednoduše přetáhněte fakturu nebo účtenku do našeho systému. Podporujeme PDF, JPG, PNG a další formáty.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 hover:bg-emerald-700 transition-colors">
                <Brain className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 text-white" />
              </div>
              <div className="bg-emerald-100 rounded-full w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-emerald-600 font-bold text-base sm:text-lg">2</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">AI zpracování</h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg px-4 sm:px-0">
                Naše hybridní OCR + AI technologie automaticky extrahuje všechna důležitá data s 99% přesností během
                sekund.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 hover:bg-blue-700 transition-colors">
                <Send className="w-8 sm:w-10 lg:w-12 h-8 sm:h-10 lg:h-12 text-white" />
              </div>
              <div className="bg-blue-100 rounded-full w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <span className="text-blue-600 font-bold text-base sm:text-lg">3</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Export do ERP</h3>
              <p className="text-gray-600 leading-relaxed text-base sm:text-lg px-4 sm:px-0">
                Data se automaticky exportují do vašeho ERP systému (Pohoda, Money S3) nebo si stáhněte v požadovaném
                formátu.
              </p>
            </div>
          </div>

          <div className="text-center mt-16 sm:mt-20">
            <LoadingButton
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 h-12 sm:h-auto min-w-[44px]"
              showArrow
            >
              Vyzkoušet proces zdarma
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <Badge className="mb-6 sm:mb-8 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm sm:text-base">
              Pokročilé funkce
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4 sm:px-0">
              Vše co potřebujete pro <span className="text-blue-600">moderní účetnictví</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 sm:px-0">
              Kombinujeme nejlepší OCR technologie s umělou inteligencí pro maximální přesnost a efektivitu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white group">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-700 transition-colors">
                  <Scan className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">Automatická extrakce dat</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Okamžité rozpoznání a extrakce všech důležitých údajů z faktur a účtenek s 99% přesností
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white group">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-emerald-700 transition-colors">
                  <Brain className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">Hybridní OCR + AI</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Kombinace bezplatného Tesseract OCR s prémiovou AI technologií pro maximální přesnost a rychlost
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white group">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-700 transition-colors">
                  <CreditCard className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">Flexibilní kreditový systém</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Plaťte pouze za to, co skutečně zpracujete. Žádné měsíční poplatky, žádné závazky
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white group">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-emerald-700 transition-colors">
                  <Database className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">České ERP integrace</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Přímé propojení s Pohoda, Money S3, Helios a dalšími českými ERP systémy během 5 minut
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white group">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-700 transition-colors">
                  <Download className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">Univerzální export</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Podpora všech standardních formátů: CSV, JSON, ISDOC, XML pro snadnou integraci s jakýmkoli systémem
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white group">
              <CardHeader className="pb-4 sm:pb-6">
                <div className="w-12 sm:w-14 lg:w-16 h-12 sm:h-14 lg:h-16 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-emerald-700 transition-colors">
                  <Zap className="w-6 sm:w-7 lg:w-8 h-6 sm:h-7 lg:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl mb-2 sm:mb-3">Okamžité nastavení</CardTitle>
                <CardDescription className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  Rychlá implementace bez složitých nastavení - začněte používat během 5 minut
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <Badge className="mb-6 sm:mb-8 bg-yellow-50 text-yellow-700 border-yellow-200 px-4 py-2 text-sm sm:text-base">
              Reference zákazníků
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4 sm:px-0">
              Co říkají naši <span className="text-emerald-600">spokojení zákazníci</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 sm:px-0">
              Přes 1200 českých firem již ušetřilo tisíce hodin práce a eliminovalo chyby v účetnictví
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center mb-4 sm:mb-6" role="img" aria-label="5 hvězdiček">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  "Askelio nám ušetřilo 12 hodin týdně na zpracování faktur. Chyby se snížily na minimum a integrace s
                  Pohodou byla hračka."
                </p>
                <div className="flex items-center">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-white font-bold text-base sm:text-lg">MN</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-base sm:text-lg">Martin Novák</div>
                    <div className="text-gray-600 text-sm sm:text-base">Ředitel, TechSoft s.r.o.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center mb-4 sm:mb-6" role="img" aria-label="5 hvězdiček">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  "Jako účetní kancelář zpracováváme stovky faktur měsíčně. Askelio nám zvýšilo produktivitu o 300% a
                  klienti jsou nadšení."
                </p>
                <div className="flex items-center">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 bg-emerald-600 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-white font-bold text-base sm:text-lg">KS</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-base sm:text-lg">Klára Svobodová</div>
                    <div className="text-gray-600 text-sm sm:text-base">Majitelka, Účetní služby Praha</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-center mb-4 sm:mb-6" role="img" aria-label="5 hvězdiček">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                  "Konečně řešení, které skutečně funguje! Nastavení trvalo 5 minut a od té doby zpracováváme faktury
                  automaticky."
                </p>
                <div className="flex items-center">
                  <div className="w-12 sm:w-14 h-12 sm:h-14 bg-blue-600 rounded-full flex items-center justify-center mr-3 sm:mr-4">
                    <span className="text-white font-bold text-base sm:text-lg">PH</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-base sm:text-lg">Petr Horák</div>
                    <div className="text-gray-600 text-sm sm:text-base">Freelancer, IT konzultant</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16 sm:mt-20">
            <LoadingButton
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 h-12 sm:h-auto min-w-[44px]"
              showArrow
            >
              Přidat se k spokojeným zákazníkům
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <Badge className="mb-6 sm:mb-8 bg-emerald-50 text-emerald-700 border-emerald-200 px-4 py-2 text-sm sm:text-base">
              Transparentní ceník
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4 sm:px-0">
              Plaťte pouze za to, <span className="text-emerald-600">co skutečně použijete</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 sm:px-0">
              Žádné měsíční poplatky, žádné závazky. Vyberte si balíček kreditů podle vašich potřeb.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto">
            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <TrendingUp className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl mb-2 sm:mb-3">START</CardTitle>
                <CardDescription className="text-base sm:text-lg text-gray-600">
                  Ideální pro začínající firmy
                </CardDescription>
                <div className="mt-6 sm:mt-8">
                  <span className="text-4xl sm:text-5xl font-bold text-blue-600">150 Kč</span>
                  <span className="text-gray-600 text-base sm:text-lg">/100 kreditů</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">= 1,50 Kč za dokument</div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">100 kreditů pro zpracování</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Základní OCR technologie</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Export do CSV, JSON</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Email podpora</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Základní ERP integrace</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 h-11 sm:h-12 min-w-[44px]">
                  Začít se START
                </LoadingButton>
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-500 shadow-lg hover:shadow-xl transition-shadow bg-white relative">
              <Badge className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-4 sm:px-6 py-1 sm:py-2 text-xs sm:text-sm font-bold">
                NEJPOPULÁRNĚJŠÍ
              </Badge>
              <CardHeader className="text-center pb-6 sm:pb-8 pt-8 sm:pt-10">
                <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Award className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl mb-2 sm:mb-3">PROFI</CardTitle>
                <CardDescription className="text-base sm:text-lg text-gray-600">Pro rostoucí firmy</CardDescription>
                <div className="mt-6 sm:mt-8">
                  <span className="text-4xl sm:text-5xl font-bold text-emerald-600">700 Kč</span>
                  <span className="text-gray-600 text-base sm:text-lg">/500 kreditů</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">= 1,40 Kč za dokument</div>
                <div className="text-xs sm:text-sm text-emerald-600 font-semibold mt-1">Ušetříte 50 Kč!</div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">500 kreditů pro zpracování</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Hybridní OCR + AI technologie</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Všechny export formáty</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Pokročilá ERP integrace</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Prioritní podpora</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">API přístup</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 sm:py-4 h-11 sm:h-12 min-w-[44px]">
                  Začít s PROFI
                </LoadingButton>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white md:col-span-2 lg:col-span-1">
              <CardHeader className="text-center pb-6 sm:pb-8">
                <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Users className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl mb-2 sm:mb-3">BUSINESS</CardTitle>
                <CardDescription className="text-base sm:text-lg text-gray-600">Pro velké firmy</CardDescription>
                <div className="mt-6 sm:mt-8">
                  <span className="text-4xl sm:text-5xl font-bold text-blue-600">1250 Kč</span>
                  <span className="text-gray-600 text-base sm:text-lg">/1000 kreditů</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">= 1,25 Kč za dokument</div>
                <div className="text-xs sm:text-sm text-emerald-600 font-semibold mt-1">Ušetříte 250 Kč!</div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">1000 kreditů pro zpracování</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Prémiová AI technologie</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Všechny funkce</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Dedikovaný účetní manažer</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">24/7 podpora</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 mr-3 sm:mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Vlastní integrace</span>
                  </li>
                </ul>
                <LoadingButton className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-4 h-11 sm:h-12 min-w-[44px]">
                  Začít s BUSINESS
                </LoadingButton>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16 sm:mt-20">
            <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg px-4 sm:px-0">
              Potřebujete více kreditů nebo individuální řešení? <strong>Kontaktujte nás pro speciální nabídku.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 sm:px-0">
              <LoadingButton
                variant="outline"
                size="lg"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 sm:px-10 py-3 sm:py-4 bg-transparent h-11 sm:h-12 min-w-[44px]"
              >
                Kontaktovat prodej
              </LoadingButton>
              <LoadingButton
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 sm:px-10 py-3 sm:py-4 h-11 sm:h-12 min-w-[44px]"
                showArrow
                asChild
              >
                <a href="/auth/register">Vyzkoušet zdarma</a>
              </LoadingButton>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-16 sm:py-24 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <Badge className="mb-6 sm:mb-8 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm sm:text-base">
              Konkrétní výhody
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4 sm:px-0">
              Proč si vybrat <span className="text-blue-600">Askelio?</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 sm:px-0">
              Přes 1200 českých firem již ušetřilo tisíce hodin práce a eliminovalo chyby v účetnictví
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-20 items-center max-w-7xl mx-auto">
            <div>
              <div className="space-y-8 sm:space-y-10 lg:space-y-12">
                <div className="flex items-start space-x-4 sm:space-x-6 lg:space-x-8">
                  <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-blue-700 transition-colors">
                    <Clock className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Ušetřete až 15 hodin týdně
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Automatizujte manuální přepisování faktur a účtenek. Co dříve trvalo celý den, nyní zvládnete za
                      15 minut. Naši zákazníci v průměru ušetří{" "}
                      <strong className="text-blue-600 font-semibold">15 hodin týdně</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6 lg:space-x-8">
                  <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-emerald-700 transition-colors">
                    <Shield className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Snižte chyby o 95%</h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      AI technologie zajišťuje 99% přesnost při rozpoznávání textu a čísel, čímž eliminuje nákladné
                      chyby v účetnictví. Naši klienti hlásí{" "}
                      <strong className="text-emerald-600 font-semibold">95% snížení chyb</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6 lg:space-x-8">
                  <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-blue-700 transition-colors">
                    <Database className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Integrace za 5 minut</h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Přímé propojení s českými ERP systémy jako Pohoda a Money S3. Data se automaticky synchronizují
                      bez manuálních zásahů. Nastavení trvá pouze{" "}
                      <strong className="text-blue-600 font-semibold">5 minut</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 sm:space-x-6 lg:space-x-8">
                  <div className="w-16 sm:w-18 lg:w-20 h-16 sm:h-18 lg:h-20 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-emerald-700 transition-colors">
                    <Users className="w-8 sm:w-9 lg:w-10 h-8 sm:h-9 lg:h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Navrženo pro české firmy
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Speciálně vytvořeno pro malé a střední firmy, freelancery a účetní kanceláře v ČR. Podporujeme
                      české formáty, DPH a legislativu. Používá nás přes{" "}
                      <strong className="text-emerald-600 font-semibold">1200 českých firem</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 lg:p-12 shadow-sm">
              <div className="text-center">
                <div className="w-20 sm:w-24 lg:w-28 h-20 sm:h-24 lg:h-28 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                  <FileText className="w-10 sm:w-12 lg:w-14 h-10 sm:h-12 lg:h-14 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Začněte ještě dnes zdarma</h3>
                <p className="text-gray-600 mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed">
                  Vyzkoušejte Askelio zdarma a přesvědčte se o výhodách automatizovaného zpracování faktur a účtenek.
                  Žádná kreditní karta není potřeba.
                </p>
                <div className="space-y-4 sm:space-y-6">
                  <LoadingButton
                    size="lg"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl py-4 sm:py-6 h-12 sm:h-auto min-w-[44px]"
                    showArrow
                    asChild
                  >
                    <a href="/auth/register">Vyzkoušet zdarma - bez karty</a>
                  </LoadingButton>
                  <LoadingButton
                    variant="outline"
                    size="lg"
                    className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 text-lg sm:text-xl py-4 sm:py-6 bg-transparent h-12 sm:h-auto min-w-[44px]"
                  >
                    Naplánovat demo (15 min)
                  </LoadingButton>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
                  ✓ Bez závazků ✓ Okamžité nastavení ✓ Česká podpora
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20 lg:mb-24">
            <Badge className="mb-6 sm:mb-8 bg-blue-50 text-blue-700 border-blue-200 px-4 py-2 text-sm sm:text-base">
              Často kladené otázky
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 tracking-tight px-4 sm:px-0">
              Máte <span className="text-blue-600">otázky?</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-light px-4 sm:px-0">
              Odpovědi na nejčastější otázky o Askelio a automatizovaném zpracování faktur
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Jak přesné je rozpoznávání textu z faktur?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Naše hybridní OCR + AI technologie dosahuje 99% přesnosti při rozpoznávání textu z faktur a
                      účtenek. Pro složitější dokumenty používáme pokročilou AI, která dokáže rozpoznat i ručně psaný
                      text a poškozené dokumenty.
                    </p>
                  </div>
                  <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 ml-4 sm:ml-6 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Jak rychle se Askelio integruje s mým ERP systémem?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Integrace s českými ERP systémy jako Pohoda, Money S3, Helios nebo ABRA trvá průměrně 5 minut.
                      Stačí zadat přístupové údaje a systém se automaticky propojí. Nabízíme také API pro vlastní
                      integrace.
                    </p>
                  </div>
                  <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 ml-4 sm:ml-6 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Kolik stojí zpracování jedné faktury?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Cena za zpracování jedné faktury se pohybuje od 1,25 Kč do 1,50 Kč v závislosti na zvoleném
                      balíčku. Čím větší balíček si koupíte, tím nižší je cena za dokument. Žádné měsíční poplatky ani
                      skryté náklady.
                    </p>
                  </div>
                  <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 ml-4 sm:ml-6 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Jaké formáty dokumentů Askelio podporuje?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Podporujeme všechny běžné formáty: PDF, JPG, PNG, TIFF, BMP. Dokumenty mohou být naskenované,
                      vyfocené mobilem nebo v elektronické podobě. Systém automaticky rozpozná typ dokumentu a použije
                      nejvhodnější metodu zpracování.
                    </p>
                  </div>
                  <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 ml-4 sm:ml-6 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Je možné vyzkoušet Askelio zdarma?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Ano! Nabízíme bezplatnou zkušební verzi s 10 kredity zdarma. Můžete si vyzkoušet všechny funkce
                      bez nutnosti zadávat platební údaje. Registrace trvá méně než minutu a okamžitě můžete začít
                      zpracovávat dokumenty.
                    </p>
                  </div>
                  <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 ml-4 sm:ml-6 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-6 sm:p-8 lg:p-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                      Jak je zajištěna bezpečnost mých dat?
                    </h3>
                    <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                      Všechna data jsou šifrována pomocí AES-256 a přenášena přes zabezpečené HTTPS spojení. Servery
                      jsou umístěny v EU a splňují GDPR. Dokumenty jsou automaticky smazány po 30 dnech. Máme ISO 27001
                      certifikaci pro bezpečnost informací.
                    </p>
                  </div>
                  <ChevronDown className="w-5 sm:w-6 h-5 sm:h-6 text-gray-400 ml-4 sm:ml-6 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-16 sm:mt-20">
            <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg px-4 sm:px-0">
              Nenašli jste odpověď na svou otázku?
            </p>
            <LoadingButton
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 h-12 sm:h-auto min-w-[44px]"
              showArrow
            >
              Kontaktovat podporu
            </LoadingButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">
            <div className="md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6 sm:mb-8">
                <Image
                  src="/askelio-logo.svg"
                  alt="Askelio Logo"
                  width={48}
                  height={48}
                  className="h-10 sm:h-12 w-auto brightness-0 invert"
                />
                <span className="text-2xl sm:text-3xl font-bold text-white">Askelio</span>
              </div>
              <p className="text-gray-300 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
                Automatizované zpracování faktur a účtenek pomocí AI technologií pro české firmy.
              </p>
              <div className="flex space-x-4">
                <LoadingButton size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-12 min-w-[44px]" asChild>
                  <a href="/auth/register">Vyzkoušet zdarma</a>
                </LoadingButton>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 sm:mb-8 text-lg sm:text-xl">Produkt</h4>
              <ul className="space-y-3 sm:space-y-4 text-gray-300">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Funkce
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Ceník
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Integrace
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    API dokumentace
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 sm:mb-8 text-lg sm:text-xl">Podpora</h4>
              <ul className="space-y-3 sm:space-y-4 text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Nápověda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Kontakt
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Status systému
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 sm:mb-8 text-lg sm:text-xl">Společnost</h4>
              <ul className="space-y-3 sm:space-y-4 text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    O nás
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Kariéra
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-white transition-colors text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                    tabIndex={0}
                  >
                    Podmínky použití
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-16 sm:mt-20 pt-8 sm:pt-10">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-base sm:text-lg mb-4 md:mb-0">
                &copy; 2024 Askelio. Všechna práva vyhrazena. Vytvořeno s ❤️ pro české firmy.
              </p>
              <div className="flex space-x-6 sm:space-x-8">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  tabIndex={0}
                >
                  Ochrana osobních údajů
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-md px-1 py-1"
                  tabIndex={0}
                >
                  Podmínky
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
