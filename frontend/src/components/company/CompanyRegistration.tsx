'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, Users, FileText, CheckCircle, ArrowRight, Loader2, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  display_name: string
  description: string
  max_users: number
  max_documents_per_month: number
  max_storage_gb: number
  has_approval_workflow: boolean
  has_advanced_analytics: boolean
  has_api_access: boolean
  has_custom_integrations: boolean
  has_priority_support: boolean
  monthly_price_czk: number
  yearly_price_czk: number
}

interface CompanyRegistrationProps {
  onComplete?: (companyId: string) => void
}

export default function CompanyRegistration({ onComplete }: CompanyRegistrationProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  
  const [companyData, setCompanyData] = useState({
    name: '',
    legal_name: '',
    registration_number: '',
    tax_number: '',
    email: '',
    phone: '',
    website: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postal_code: '',
    country: 'CZ',
    billing_email: ''
  })

  useEffect(() => {
    loadAvailablePlans()
  }, [])

  const loadAvailablePlans = async () => {
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.getAvailablePlans()
      
      if (result.success) {
        setPlans(result.data)
        // Auto-select free plan
        const freePlan = result.data.find((plan: Plan) => plan.name === 'free')
        if (freePlan) {
          setSelectedPlan(freePlan.name)
        }
      } else {
        toast.error(result.message || 'Nepodařilo se načíst dostupné plány')
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Chyba při načítání plánů')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCreateCompany = async () => {
    if (!companyData.name.trim()) {
      toast.error('Název firmy je povinný')
      return
    }

    if (!selectedPlan) {
      toast.error('Vyberte plán')
      return
    }

    setLoading(true)
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.createCompany(companyData)
      
      if (result.success) {
        toast.success('Firma byla úspěšně vytvořena!')
        
        if (onComplete) {
          onComplete(result.data.id)
        } else {
          router.push('/dashboard')
        }
      } else {
        toast.error(result.message || 'Nepodařilo se vytvořit firmu')
      }
    } catch (error) {
      console.error('Error creating company:', error)
      toast.error('Chyba při vytváření firmy')
    } finally {
      setLoading(false)
    }
  }

  const getPlanPrice = (plan: Plan) => {
    return billingCycle === 'yearly' ? plan.yearly_price_czk : plan.monthly_price_czk
  }

  const getPlanBadgeVariant = (planName: string) => {
    switch (planName) {
      case 'free': return 'secondary'
      case 'basic': return 'default'
      case 'premium': return 'destructive'
      case 'enterprise': return 'outline'
      default: return 'outline'
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vyberte plán pro vaši firmu</h2>
              <p className="text-gray-600">Můžete kdykoli změnit nebo upgradovat váš plán</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={billingCycle === 'monthly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('monthly')}
                >
                  Měsíčně
                </Button>
                <Button
                  variant={billingCycle === 'yearly' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBillingCycle('yearly')}
                >
                  Ročně <Badge className="ml-1 bg-green-500">-17%</Badge>
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    selectedPlan === plan.name 
                      ? 'ring-2 ring-blue-500 border-blue-500' 
                      : 'hover:shadow-md'
                  } ${plan.name === 'premium' ? 'border-purple-500' : ''}`}
                  onClick={() => setSelectedPlan(plan.name)}
                >
                  <CardHeader className="text-center pb-4">
                    {plan.name === 'premium' && (
                      <Badge className="mb-2 bg-purple-500 text-white">NEJPOPULÁRNĚJŠÍ</Badge>
                    )}
                    <CardTitle className="text-lg">{plan.display_name}</CardTitle>
                    <div className="text-2xl font-bold">
                      {getPlanPrice(plan) === 0 ? 'Zdarma' : `${getPlanPrice(plan).toLocaleString()} Kč`}
                      {getPlanPrice(plan) > 0 && (
                        <span className="text-sm text-gray-500 font-normal">
                          /{billingCycle === 'yearly' ? 'rok' : 'měsíc'}
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 mr-2 text-gray-500" />
                      {plan.max_users === -1 ? 'Neomezení' : plan.max_users} zaměstnanců
                    </div>
                    <div className="flex items-center text-sm">
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      {plan.max_documents_per_month === -1 ? 'Neomezené' : plan.max_documents_per_month} dokumenty/měsíc
                    </div>
                    {plan.has_approval_workflow && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Schvalovací workflow
                      </div>
                    )}
                    {plan.has_advanced_analytics && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Pokročilé analýzy
                      </div>
                    )}
                    {plan.has_api_access && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        API přístup
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!selectedPlan}
                className="min-w-[120px]"
              >
                Pokračovat <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Informace o firmě</h2>
              <p className="text-gray-600">Vyplňte základní údaje o vaší firmě</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Název firmy *</Label>
                  <Input
                    id="name"
                    value={companyData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Název vaší firmy"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="legal_name">Právní název</Label>
                  <Input
                    id="legal_name"
                    value={companyData.legal_name}
                    onChange={(e) => handleInputChange('legal_name', e.target.value)}
                    placeholder="Oficiální název firmy"
                  />
                </div>

                <div>
                  <Label htmlFor="registration_number">IČO</Label>
                  <Input
                    id="registration_number"
                    value={companyData.registration_number}
                    onChange={(e) => handleInputChange('registration_number', e.target.value)}
                    placeholder="12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="tax_number">DIČ</Label>
                  <Input
                    id="tax_number"
                    value={companyData.tax_number}
                    onChange={(e) => handleInputChange('tax_number', e.target.value)}
                    placeholder="CZ12345678"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">E-mail firmy</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="info@firma.cz"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={companyData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+420 123 456 789"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Webové stránky</Label>
                  <Input
                    id="website"
                    value={companyData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://www.firma.cz"
                  />
                </div>

                <div>
                  <Label htmlFor="address_line1">Adresa</Label>
                  <Input
                    id="address_line1"
                    value={companyData.address_line1}
                    onChange={(e) => handleInputChange('address_line1', e.target.value)}
                    placeholder="Ulice a číslo popisné"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
              >
                Zpět
              </Button>
              <Button 
                onClick={handleCreateCompany}
                disabled={loading || !companyData.name.trim()}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vytváření...
                  </>
                ) : (
                  <>
                    Vytvořit firmu <Building2 className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            1
          </div>
          <div className={`h-1 w-16 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vytvoření firemního účtu</h1>
          <p className="text-gray-600">
            Krok {currentStep} ze 2: {currentStep === 1 ? 'Výběr plánu' : 'Informace o firmě'}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  )
}
