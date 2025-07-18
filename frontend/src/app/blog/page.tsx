'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react'

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "Jak OCR technologie mění zpracování faktur v roce 2025",
      excerpt: "Moderní OCR systémy dosahují 98,5% přesnosti při rozpoznávání faktur. Zjistěte, jak tato technologie revolucionizuje účetní procesy.",
      author: "Tomáš Novák",
      date: "15. ledna 2025",
      readTime: "5 min čtení",
      category: "OCR Technologie",
      image: "/api/placeholder/400/250",
      featured: true
    },
    {
      id: 2,
      title: "Integrace Askelio s SAP: Kompletní průvodce",
      excerpt: "Krok za krokem návod, jak propojit Askelio OCR systém s vaším SAP ERP pro automatické zpracování faktur.",
      author: "Pavel Dvořák",
      date: "12. ledna 2025",
      readTime: "8 min čtení",
      category: "ERP Integrace",
      image: "/api/placeholder/400/250"
    },
    {
      id: 3,
      title: "5 způsobů, jak ušetřit 20 hodin týdně při zpracování faktur",
      excerpt: "Praktické tipy pro automatizaci účetních procesů. Reálné příklady firem, které díky OCR ušetřily desítky hodin práce.",
      author: "Jana Procházková",
      date: "10. ledna 2025",
      readTime: "6 min čtení",
      category: "Automatizace",
      image: "/api/placeholder/400/250"
    },
    {
      id: 4,
      title: "GDPR a zpracování faktur: Co musíte vědět",
      excerpt: "Jak zajistit GDPR compliance při automatickém zpracování faktur a dokumentů. Bezpečnostní opatření a best practices.",
      author: "Marie Svobodová",
      date: "8. ledna 2025",
      readTime: "4 min čtení",
      category: "Bezpečnost",
      image: "/api/placeholder/400/250"
    },
    {
      id: 5,
      title: "ROI automatizace faktur: Kalkulačka návratnosti",
      excerpt: "Spočítejte si, kolik ušetříte automatizací zpracování faktur. Včetně kalkulačky a reálných příkladů z praxe.",
      author: "Tomáš Novák",
      date: "5. ledna 2025",
      readTime: "7 min čtení",
      category: "Business",
      image: "/api/placeholder/400/250"
    },
    {
      id: 6,
      title: "Pohoda vs Money S3: Která integrace je lepší?",
      excerpt: "Porovnání integrace Askelio s nejpopulárnějšími českými ERP systémy. Výhody, nevýhody a doporučení.",
      author: "Pavel Dvořák",
      date: "3. ledna 2025",
      readTime: "6 min čtení",
      category: "ERP Integrace",
      image: "/api/placeholder/400/250"
    }
  ]

  const categories = ["Všechny", "OCR Technologie", "ERP Integrace", "Automatizace", "Bezpečnost", "Business"]

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
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Askelio Blog</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Praktické články o OCR zpracování faktur, ERP integraci a automatizaci účetních procesů
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  index === 0
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Featured Post */}
          {blogPosts.filter(post => post.featured).map((post) => (
            <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-16">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-8 lg:p-12 flex items-center">
                  <div>
                    <div className="flex items-center mb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Doporučujeme
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">{post.title}</h2>
                    <p className="text-gray-600 mb-6 leading-relaxed">{post.excerpt}</p>
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                      <User className="w-4 h-4 mr-2" />
                      <span className="mr-4">{post.author}</span>
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="mr-4">{post.date}</span>
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{post.readTime}</span>
                    </div>
                    <Link
                      href={`/blog/${post.id}`}
                      className="inline-flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      Číst článek
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8">
                  <div className="text-center text-gray-500">
                    <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white text-4xl font-bold">AI</span>
                    </div>
                    <p>Obrázek článku</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.filter(post => !post.featured).map((post) => (
              <article
                key={post.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group"
              >
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mx-auto mb-2 flex items-center justify-center">
                      <Tag className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm">{post.category}</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <User className="w-3 h-3 mr-1" />
                    <span className="mr-3">{post.author}</span>
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="mr-3">{post.date}</span>
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{post.readTime}</span>
                  </div>
                  <Link
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    Číst více
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="bg-white text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
              Načíst další články
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Zůstaňte v obraze</h2>
          <p className="text-xl text-blue-100 mb-8">
            Přihlaste se k odběru našeho newsletteru a získejte nejnovější články přímo do e-mailu
          </p>
          <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
            <input
              type="email"
              placeholder="vas@email.cz"
              className="flex-1 px-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Přihlásit se
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
