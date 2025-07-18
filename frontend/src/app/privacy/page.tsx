'use client'

import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Database, Users, FileText } from 'lucide-react'

export default function PrivacyPage() {
  const sections = [
    {
      icon: <Eye className="w-6 h-6 text-blue-600" />,
      title: "Jaké informace sbíráme",
      content: [
        "Osobní údaje: jméno, e-mailová adresa, telefonní číslo",
        "Firemní údaje: název společnosti, adresa, IČO",
        "Technické údaje: IP adresa, typ prohlížeče, operační systém",
        "Údaje o používání: jak používáte naše služby a aplikace"
      ]
    },
    {
      icon: <Database className="w-6 h-6 text-blue-600" />,
      title: "Jak používáme vaše údaje",
      content: [
        "Poskytování a zlepšování našich služeb",
        "Komunikace s vámi ohledně vašeho účtu a služeb",
        "Zasílání důležitých oznámení a aktualizací",
        "Analýza používání pro zlepšení uživatelské zkušenosti"
      ]
    },
    {
      icon: <Lock className="w-6 h-6 text-blue-600" />,
      title: "Jak chráníme vaše údaje",
      content: [
        "Šifrování všech dat při přenosu i ukládání",
        "Pravidelné bezpečnostní audity a testy",
        "Omezený přístup pouze pro autorizované zaměstnance",
        "Zálohy dat v zabezpečených datových centrech"
      ]
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: "Sdílení údajů s třetími stranami",
      content: [
        "Nesdílíme vaše osobní údaje s třetími stranami bez vašeho souhlasu",
        "Výjimky: právní požadavky, ochrana našich práv",
        "Používáme důvěryhodné poskytovatele služeb (hosting, analytics)",
        "Všichni partneři musí dodržovat přísné bezpečnostní standardy"
      ]
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Zásady ochrany soukromí</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Vaše soukromí je pro nás prioritou. Tato stránka vysvětluje, jak společnost Askela s.r.o. sbírá, používá a chrání vaše osobní údaje.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl mt-6">
              <p className="text-sm text-gray-600">
                <strong>Správce osobních údajů:</strong> Askela s.r.o., IČO: 26757125, DIČ: CZ26757125<br />
                <strong>Sídlo:</strong> Korunní 2569/108, 101 00 Praha 10 - Vinohrady<br />
                <strong>Kontakt:</strong> privacy@askela.cz
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Poslední aktualizace: 15. ledna 2025
            </p>
          </div>

          {/* Main Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
                <div className="flex items-center mb-6">
                  {section.icon}
                  <h2 className="text-2xl font-semibold text-gray-900 ml-3">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* GDPR Rights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900 ml-3">Vaše práva podle GDPR</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Máte právo na:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-600">Přístup k vašim osobním údajům</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-600">Opravu nesprávných údajů</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-600">Výmaz vašich údajů</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-gray-600">Přenositelnost údajů</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Jak uplatnit svá práva:</h3>
                  <p className="text-gray-600 mb-4">
                    Pro uplatnění vašich práv nás kontaktujte na e-mailu privacy@askela.cz nebo prostřednictvím kontaktního formuláře.
                  </p>
                  <p className="text-gray-600">
                    Na vaši žádost odpovíme do 30 dnů od jejího doručení.
                  </p>
                </div>
              </div>
            </div>

            {/* Cookies */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Cookies a sledovací technologie</h2>
              <div className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  Používáme cookies a podobné technologie pro zlepšení funkčnosti našich webových stránek a služeb. 
                  Cookies nám pomáhají pochopit, jak používáte naše služby, a personalizovat váš zážitek.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Nezbytné cookies</h3>
                    <p className="text-sm text-gray-600">Potřebné pro základní funkčnost webu</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Analytické cookies</h3>
                    <p className="text-sm text-gray-600">Pomáhají nám zlepšovat naše služby</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <h3 className="font-semibold text-gray-900 mb-2">Marketingové cookies</h3>
                    <p className="text-sm text-gray-600">Pro personalizaci reklam a obsahu</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-semibold mb-4">Máte otázky ohledně ochrany soukromí?</h2>
              <p className="text-blue-100 mb-6">
                Pokud máte jakékoli dotazy nebo obavy ohledně našich zásad ochrany soukromí, neváhejte nás kontaktovat.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/contact"
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Kontaktujte nás
                </Link>
                <a
                  href="mailto:privacy@askela.cz"
                  className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  privacy@askela.cz
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
