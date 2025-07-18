'use client'

import Link from 'next/link'
import { ArrowLeft, Users, Target, Award, Heart, Zap, Shield, Globe } from 'lucide-react'

export default function AboutPage() {
  const team = [
    {
      name: "Tomáš Novák",
      role: "CEO & Zakladatel",
      description: "15 let zkušeností v oblasti OCR technologií a automatizace účetních procesů",
      avatar: "TN"
    },
    {
      name: "Marie Svobodová",
      role: "CTO & AI Engineer",
      description: "Expertka na strojové učení a rozpoznávání textu z dokumentů",
      avatar: "MS"
    },
    {
      name: "Pavel Dvořák",
      role: "Head of Integrations",
      description: "Specialista na ERP integrace a API vývoj",
      avatar: "PD"
    },
    {
      name: "Jana Procházková",
      role: "Customer Success",
      description: "Pomáhá klientům s implementací a optimalizací OCR procesů",
      avatar: "JP"
    }
  ]

  const values = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "Přesnost",
      description: "98,5% přesnost OCR rozpoznávání - spolehlivé výsledky pro vaše účetní procesy"
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: "Bezpečnost",
      description: "GDPR compliance, šifrování AES-256 a automatické mazání dokumentů"
    },
    {
      icon: <Heart className="w-8 h-8 text-blue-600" />,
      title: "Jednoduchost",
      description: "Intuitivní rozhraní - nahrajte fakturu a během sekund máte data v ERP"
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: "Integrace",
      description: "Podporujeme 15+ ERP systémů a můžeme vytvořit vlastní API integraci"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900">Askelio</Link>
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zpět na hlavní stránku
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">O společnosti Askelio</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Askela s.r.o. se specializuje na automatizaci zpracování faktur a dokumentů pomocí pokročilých OCR a AI technologií.
              Pomáháme firmám digitalizovat jejich účetní procesy a ušetřit desítky hodin měsíčně.
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 mt-8 max-w-2xl mx-auto border border-gray-200">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">Askela s.r.o.</h3>
                <p className="text-sm text-gray-600">
                  IČO: 26757125 | DIČ: CZ26757125<br />
                  Korunní 2569/108, 101 00 Praha 10 - Vinohrady<br />
                  Zapsáno v obchodním rejstříku u Městského soudu v Praze
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Naše mise</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Věříme, že každá firma by měla mít přístup k nejmodernějším technologiám pro automatizaci svých procesů. 
                Proto jsme vytvořili Askelio - platformu, která kombinuje sílu umělé inteligence s jednoduchým a intuitivním rozhraním.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Naše OCR technologie dosahuje přesnosti 98,5% a pomáhá firmám zpracovat tisíce dokumentů denně s minimálním lidským zásahem.
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 rounded-2xl">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">2019</div>
                  <div className="text-sm text-gray-600">Rok založení</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">2,500+</div>
                  <div className="text-sm text-gray-600">Spokojených zákazníků</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">98.5%</div>
                  <div className="text-sm text-gray-600">Přesnost OCR</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Podpora</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Naše hodnoty</h2>
            <p className="text-xl text-gray-600">
              Principy, které nás vedou při každodenní práci
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-all duration-300 group"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-200">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Náš tým</h2>
            <p className="text-xl text-gray-600">
              Poznejte lidi, kteří stojí za Askelio
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-center group"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl group-hover:scale-110 transition-transform duration-200">
                  {member.avatar}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Připojte se k nám</h2>
          <p className="text-xl text-blue-100 mb-8">
            Začněte automatizovat své procesy ještě dnes a ušetřete čas i peníze
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Začít zdarma
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Kontaktujte nás
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
