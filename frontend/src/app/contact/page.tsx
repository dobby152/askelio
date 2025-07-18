'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock, MessageCircle } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulace odeslání formuláře
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSuccess(true)
    setLoading(false)
    
    // Reset formuláře po 3 sekundách
    setTimeout(() => {
      setSuccess(false)
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

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
            <h1 className="text-5xl font-bold text-gray-900 mb-6">Kontaktujte nás</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Potřebujete demo OCR systému nebo pomoc s integrací do vašeho ERP? Kontaktujte nás a my vám ukážeme, jak Askelio zefektivní vaše účetní procesy.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Napište nám</h2>
              
              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Send className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Zpráva odeslána!</h3>
                  <p className="text-gray-600">Děkujeme za vaši zprávu. Ozveme se vám do 24 hodin.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Jméno a příjmení *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="Jan Novák"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="jan@firma.cz"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Společnost
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                      placeholder="Název vaší společnosti"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Předmět *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    >
                      <option value="">Vyberte předmět</option>
                      <option value="demo">Demo OCR systému</option>
                      <option value="integration">Integrace s ERP</option>
                      <option value="pricing">Cenová nabídka</option>
                      <option value="technical">Technická podpora</option>
                      <option value="api">API dokumentace</option>
                      <option value="other">Ostatní</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Zpráva *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                      placeholder="Popište nám váš požadavek - kolik faktur zpracováváte, jaký ERP používáte, atd..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
                  >
                    {loading ? (
                      'Odesílání...'
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Odeslat zprávu
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Kontaktní informace</h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">E-mail</p>
                      <p className="text-gray-600">info@askela.cz</p>
                      <p className="text-gray-600">podpora@askela.cz</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Telefon</p>
                      <p className="text-gray-600">+420 775 123 456</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="w-6 h-6 text-blue-600 mr-4 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Adresa</p>
                      <p className="text-gray-600">Askela s.r.o.<br />Korunní 2569/108<br />101 00 Praha 10 - Vinohrady<br />IČO: 26757125<br />DIČ: CZ26757125</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Pracovní doba</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Pondělí - Pátek</p>
                      <p className="text-gray-600">9:00 - 18:00</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Online podpora</p>
                      <p className="text-gray-600">24/7</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
                <h3 className="text-xl font-semibold mb-4">Potřebujete rychlou pomoc?</h3>
                <p className="text-blue-100 mb-6">
                  Naše online podpora je k dispozici 24/7 pro všechny zákazníky s aktivním předplatným.
                </p>
                <Link
                  href="/auth/login"
                  className="inline-block bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Přihlásit se
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
