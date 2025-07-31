'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle, Scale } from 'lucide-react'

export default function TermsPage() {
  const sections = [
    {
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      title: "Přijetí podmínek",
      content: "Používáním našich služeb souhlasíte s těmito podmínkami použití. Pokud s nimi nesouhlasíte, nepoužívejte naše služby. Tyto podmínky se vztahují na všechny uživatele našich služeb."
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      title: "Popis služeb",
      content: "Askelio poskytuje AI-powered OCR služby pro automatizaci zpracování dokumentů. Naše služby zahrnují rozpoznávání textu, extrakci dat a integraci s ERP systémy. Služby jsou poskytovány prostřednictvím webové aplikace a API."
    },
    {
      icon: <Scale className="w-6 h-6 text-purple-600" />,
      title: "Uživatelské účty",
      content: "Pro používání našich služeb si musíte vytvořit uživatelský účet. Jste odpovědní za zachování důvěrnosti vašich přihlašovacích údajů a za všechny aktivity, které se uskuteční pod vaším účtem."
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      title: "Omezení použití",
      content: "Naše služby smíte používat pouze pro zákonné účely. Je zakázáno používat služby způsobem, který by mohl poškodit, zakázat nebo jinak narušit fungování služeb nebo serverů."
    }
  ]

  const prohibitedUses = [
    "Nahrávání škodlivého nebo nezákonného obsahu",
    "Pokus o neoprávněný přístup k systémům",
    "Narušování nebo poškozování služeb",
    "Používání služeb pro spam nebo obtěžování",
    "Porušování práv duševního vlastnictví",
    "Obcházení bezpečnostních opatření"
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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Podmínky použití</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Tyto podmínky upravují používání služeb Askelio provozovaných společností Askela s.r.o. Přečtěte si je pozorně před začátkem používání našich služeb.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl mt-6">
              <p className="text-sm text-gray-600">
                <strong>Provozovatel:</strong> Askela s.r.o., IČO: 26757125, DIČ: CZ26757125<br />
                <strong>Sídlo:</strong> Korunní 2569/108, 101 00 Praha 10 - Vinohrady<br />
                <strong>Zapsáno:</strong> v obchodním rejstříku vedeném Městským soudem v Praze
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Poslední aktualizace: 15. ledna 2025
            </p>
          </div>

          {/* Main Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
                <div className="flex items-center mb-4">
                  {section.icon}
                  <h2 className="text-2xl font-semibold text-gray-900 ml-3">{section.title}</h2>
                </div>
                <p className="text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            ))}

            {/* Prohibited Uses */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <div className="flex items-center mb-6">
                <XCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-2xl font-semibold text-gray-900 ml-3">Zakázané použití</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Při používání našich služeb je zakázáno:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {prohibitedUses.map((use, index) => (
                  <div key={index} className="flex items-start">
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{use}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment and Billing */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Platby a fakturace</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Předplatné</h3>
                  <p className="text-gray-600">
                    Naše služby jsou poskytovány na základě měsíčního nebo ročního předplatného. 
                    Platby jsou zpracovávány automaticky v den obnovení předplatného.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Zrušení</h3>
                  <p className="text-gray-600">
                    Předplatné můžete zrušit kdykoli prostřednictvím vašeho uživatelského účtu. 
                    Zrušení bude účinné na konci aktuálního fakturačního období.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vrácení peněz</h3>
                  <p className="text-gray-600">
                    Nabízíme 30denní záruku vrácení peněz pro nové zákazníky. 
                    Po uplynutí této doby nejsou platby vratné.
                  </p>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Duševní vlastnictví</h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Všechna práva k našim službám, včetně softwaru, designu, obsahu a ochranných známek, 
                  patří společnosti Askelio nebo našim licencním partnerům.
                </p>
                <p className="text-gray-600">
                  Vaše data a dokumenty, které nahrajete do našich služeb, zůstávají vaším vlastnictvím. 
                  Udělujete nám pouze licenci k jejich zpracování za účelem poskytování služeb.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Omezení odpovědnosti</h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Naše služby poskytujeme &quot;tak jak jsou&quot; bez jakýchkoli záruk.
                  Neneseme odpovědnost za škody vzniklé používáním našich služeb.
                </p>
                <p className="text-gray-600">
                  Maximální výše naší odpovědnosti je omezena na částku, kterou jste zaplatili 
                  za naše služby v posledních 12 měsících.
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Změny podmínek</h2>
              <p className="text-gray-600 mb-4">
                Vyhrazujeme si právo tyto podmínky kdykoli změnit. O významných změnách vás budeme 
                informovat e-mailem nebo prostřednictvím našich služeb.
              </p>
              <p className="text-gray-600">
                Pokračováním v používání našich služeb po změně podmínek vyjadřujete souhlas s novými podmínkami.
              </p>
            </div>

            {/* Governing Law */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Rozhodné právo</h2>
              <p className="text-gray-600">
                Tyto podmínky se řídí právním řádem České republiky. 
                Případné spory budou řešeny u příslušných soudů v České republice.
              </p>
            </div>

            {/* Contact */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
              <h2 className="text-2xl font-semibold mb-4">Máte otázky k podmínkám použití?</h2>
              <p className="text-blue-100 mb-6">
                Pokud máte jakékoli dotazy ohledně těchto podmínek, neváhejte nás kontaktovat.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/contact"
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Kontaktujte nás
                </Link>
                <a
                  href="mailto:legal@askela.cz"
                  className="border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  legal@askela.cz
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
