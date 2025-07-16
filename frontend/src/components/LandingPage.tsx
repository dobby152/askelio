'use client'

import { useState } from 'react'
import { Star, Users, TrendingUp, BarChart3, Globe, Lock, Sparkles, ArrowRight, Play, Check, ChevronDown, Menu, X } from 'lucide-react'

export function LandingPage() {
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const testimonials = [
    {
      text: "Vysoce intuitivní a vyleštěné. Je to vše, co jsme potřebovali a ještě více!",
      rating: 5.0,
      author: "Alex Jonas",
      company: "JS Marketing",
      avatar: "/api/placeholder/40/40"
    },
    {
      text: "Toto je skutečně neuvěřitelné a ušetřilo nám to nespočet hodin!",
      rating: 5.0,
      author: "John Robert",
      company: "SM Strategy",
      avatar: "/api/placeholder/40/40"
    },
    {
      text: "Čistá genialita! Toto masivně zefektivnilo náš workflow.",
      rating: 4.8,
      author: "Maggie Hue",
      company: "BS Growth CEO",
      avatar: "/api/placeholder/40/40"
    }
  ]

  const benefits = [
    {
      icon: <Sparkles className="w-8 h-8 text-blue-600" />,
      title: "Okamžité úspory",
      description: "Získejte okamžité úspory při každém nákupu, poháněné AI pro optimalizaci vašich transakcí."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-blue-600" />,
      title: "Přehledy v reálném čase",
      description: "Dělejte chytřejší rozhodnutí s živými daty a akčními přehledy dodávanými v reálném čase."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
      title: "Flexibilní plány",
      description: "Vyberte si plány, které se přizpůsobí potřebám vašeho podnikání s nepřekonatelnou škálovatelností."
    },
    {
      icon: <Lock className="w-8 h-8 text-blue-600" />,
      title: "Bezpečné transakce",
      description: "Upřednostněte bezpečnost s nejmodernějším šifrováním a robustními bezpečnostními funkcemi."
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-600" />,
      title: "Adaptivní systémy",
      description: "Využijte AI-řízené systémy, které se vyvíjejí s vaším podnikáním a zajišťují efektivitu."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "Specializovaná podpora",
      description: "Přístup k odborné pomoci 24/7, abyste nikdy nebyli sami na své cestě růstu."
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      monthlyPrice: 12,
      yearlyPrice: 9,
      features: [
        "Neomezené použití AI",
        "Prémiová podpora",
        "Zákaznická péče na místě",
        "Nástroje pro spolupráci",
        "Pravidelné aktualizace"
      ]
    },
    {
      name: "Pro",
      monthlyPrice: 17,
      yearlyPrice: 12,
      popular: true,
      features: [
        "Integrace s třetími stranami",
        "Pokročilá analytika",
        "Sledování výkonu týmu",
        "Špičková bezpečnost",
        "Prioritní zákaznická podpora",
        "Detailní zprávy o použití"
      ]
    },
    {
      name: "Enterprise",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
      features: [
        "Specializovaný account manager",
        "Vlastní zprávy a dashboardy",
        "Nejvyšší výkonnost",
        "Přizpůsobené onboarding",
        "Přizpůsobitelný API přístup",
        "Specializovaný success manager"
      ]
    }
  ]

  const faqs = [
    {
      question: "Co dělá tento template jedinečným?",
      answer: "Tento template je navržen pro zefektivnění online prezence vašeho SaaS nebo startupu s moderním, uživatelsky orientovaným designem a bezproblémovou funkčností."
    },
    {
      question: "Mohu přizpůsobit template své značce?",
      answer: "Absolutně! Template je plně přizpůsobitelný, umožňuje změnit barvy, fonty, obrázky a obsah tak, aby dokonale odpovídal identitě vaší značky."
    },
    {
      question: "Je template optimalizován pro SEO a rychlost?",
      answer: "Ano, template je postaven s Next.js, což zajišťuje výjimečný výkon, rychlé načítání a SEO-friendly design pro zvýšení vaší online viditelnosti."
    },
    {
      question: "Je template mobilně přívětivý?",
      answer: "Ano, template je plně responzivní a zajišťuje bezproblémovou uživatelskou zkušenost napříč desktopy, tablety a mobilními zařízeními."
    },
    {
      question: "Mohu použít tento template pro komerční projekty?",
      answer: "Ano. Můžete volně používat tento template pro osobní i komerční projekty — není vyžadováno uvedení zdroje."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ scrollBehavior: 'smooth' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-2xl font-bold text-gray-900">Askelio</div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Výhody</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Ceny</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/auth/login" className="hidden md:block text-gray-600 hover:text-gray-900 transition-colors">Přihlášení</a>
              <a href="/auth/register" className="hidden md:block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Registrace</a>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-2 space-y-2">
              <a href="#features" className="block py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#benefits" className="block py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Výhody</a>
              <a href="#pricing" className="block py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>Ceny</a>
              <a href="#faq" className="block py-2 text-gray-600 hover:text-gray-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
              <div className="pt-2 border-t border-gray-200">
                <a href="/auth/login" className="block py-2 text-gray-600 hover:text-gray-900 transition-colors">Přihlášení</a>
                <a href="/auth/register" className="block py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors">Registrace</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Social Proof */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white"></div>
              ))}
            </div>
            <span className="ml-3 text-sm text-gray-600">
              Připojte se k <span className="font-semibold text-gray-900">10,000+</span> spokojených zákazníků
            </span>
          </div>

          <div className="text-center">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Nejlepší platforma pro
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> růst vašeho</span> podnikání
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
              Nejsilnější nástroje pro zvýšení prodeje, najímání nejlepších lidí a přístup k exkluzivním tržním přehledům pomocí AI technologií.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center">
                Začít hned teď
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center">
                <Play className="mr-2 w-5 h-5" />
                Rezervovat demo
              </button>
            </div>

            {/* Company Logos */}
            <div className="flex items-center justify-center space-x-8 opacity-60">
              {['Microsoft', 'Google', 'Stripe', 'Notion', 'Slack'].map((company) => (
                <div key={company} className="text-gray-400 font-semibold text-lg">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Rozlište se</h3>
              <p className="text-gray-600 mb-8">
                Pozvedněte svou značku se zlatým odznakem a spojte se s špičkovými partnery.
              </p>
              <div className="space-y-4">
                {['Askelio Pro', 'Crystalio', 'Robinson jr'].map((name, index) => (
                  <div key={name} className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 group-hover:scale-110 transition-transform duration-200"></div>
                    <span className="font-medium text-gray-900">{name}</span>
                    <Check className="w-5 h-5 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Měsíční návštěvy</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">125,432</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Posledních 24h</span>
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">2,847</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-2">VÝHODY</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Proč si vybrat nás?</h2>
            <p className="text-xl text-gray-600">
              Inovativní nástroje a silné přehledy navržené pro povznesení vašeho podnikání
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-blue-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-200">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{benefit.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section data-testid="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-2">STĚNA LÁSKY</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Milováno mysliteli</h2>
            <p className="text-xl text-gray-600">
              Zde je to, co lidé po celém světě říkají o nás
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group bg-gray-50 p-8 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-gray-200"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="mb-6">
                  <p className="text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">"{testimonial.text}"</p>
                  <div className="flex items-center mb-4">
                    <span className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{testimonial.rating}</span>
                    <div className="flex ml-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-200" style={{ transitionDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mr-4 group-hover:scale-110 transition-transform duration-200"></div>
                  <div>
                    <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social Proof */}
          <div className="text-center mt-16">
            <div className="flex items-center justify-center mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-white"></div>
                ))}
              </div>
              <span className="ml-3 text-sm text-gray-600">
                Připojte se k <span className="font-semibold text-gray-900">1,000+</span> dalším milujícím zákazníkům
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-2">CENY & PLÁNY</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Flexibilní cenové plány</h2>
            <p className="text-xl text-gray-600">
              Vyberte si plán, který odpovídá potřebám vašeho podnikání a odemkněte plný potenciál naší platformy
            </p>
          </div>

          {/* Pricing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="bg-white p-1 rounded-xl shadow-sm">
              <button
                onClick={() => setPricingPeriod('monthly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  pricingPeriod === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPricingPeriod('yearly')}
                className={`px-6 py-2 rounded-lg font-medium transition-all relative ${
                  pricingPeriod === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  30% off
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`group bg-white p-8 rounded-2xl shadow-sm relative transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border ${
                  plan.popular
                    ? 'ring-2 ring-blue-600 scale-105 border-blue-200'
                    : 'border-gray-100 hover:border-blue-200'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Populární
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {typeof plan.monthlyPrice === 'number'
                        ? `$${pricingPeriod === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice}`
                        : plan.monthlyPrice
                      }
                    </span>
                    {typeof plan.monthlyPrice === 'number' && (
                      <span className="text-gray-600 ml-2">/ měsíc</span>
                    )}
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 hover:scale-105 transition-all duration-200 group-hover:shadow-lg">
                    Začít hned teď
                  </button>
                </div>

                <div>
                  <p className="font-medium text-gray-900 mb-4">Zahrnuje:</p>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-600">
              Askelio přispívá 5% z předplatného na udržitelný rozvoj
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section data-testid="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-2">FAQ SEKCE</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Některé běžné FAQ</h2>
            <p className="text-xl text-gray-600">
              Získejte odpovědi na své otázky a dozvěďte se více o naší platformě
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl overflow-hidden hover:bg-gray-100 transition-all duration-200 border border-transparent hover:border-gray-200">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-8 py-6 text-left flex items-center justify-between transition-colors"
                >
                  <span className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-all duration-300 ${
                      openFaq === index ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-8 pb-6 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-blue-200 mb-2">NA CO JEŠTĚ ČEKÁTE</p>
          <h2 className="text-4xl font-bold text-white mb-4">Růst nyní s Askelio</h2>
          <p className="text-xl text-blue-100 mb-8">
            Odemkněte sílu dat pro chytřejší rozhodnutí a rychlejší růst s naší platformou.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Začít hned teď
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Rezervovat demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold mb-4">Askelio</div>
              <p className="text-gray-400 mb-4">
                Nejlepší platforma pro růst vašeho podnikání pomocí AI technologií.
              </p>
              <p className="text-gray-400">askelio@mail.com</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Výhody</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Ceny</a></li>
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
                <li><a href="/terms" className="hover:text-white transition-colors">Podmínky</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 Askelio. Všechna práva vyhrazena.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
