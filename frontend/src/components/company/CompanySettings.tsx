'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, Building2, Users, FileText, HardDrive, Crown, Settings, Save, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  legal_name?: string
  registration_number?: string
  tax_number?: string
  email?: string
  phone?: string
  website?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postal_code?: string
  country: string
  approval_workflow_enabled: boolean
  current_users_count: number
  current_month_documents: number
  current_storage_gb: number
  company_plans: {
    name: string
    display_name: string
    max_users: number
    max_documents_per_month: number
    max_storage_gb: number
    has_approval_workflow: boolean
    has_advanced_analytics: boolean
    has_api_access: boolean
  }
}

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

interface CompanySettingsProps {
  companyId: string
}

export default function CompanySettings({ companyId }: CompanySettingsProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [formData, setFormData] = useState<Partial<Company>>({})

  useEffect(() => {
    loadCompanyData()
    loadAvailablePlans()
  }, [companyId])

  const loadCompanyData = async () => {
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.getCompanyDetails(companyId)

      if (result.success) {
        setCompany(result.data)
        setFormData(result.data)
      } else {
        toast.error(result.message || 'Nepodařilo se načíst data firmy')
      }
    } catch (error) {
      console.error('Error loading company:', error)
      toast.error('Chyba při načítání dat firmy')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailablePlans = async () => {
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.getAvailablePlans()

      if (result.success) {
        setPlans(result.data)
      } else {
        toast.error(result.message || 'Nepodařilo se načíst dostupné plány')
      }
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Chyba při načítání plánů')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.updateCompany(companyId, formData)

      if (result.success) {
        setCompany(result.data)
        toast.success('Nastavení firmy bylo uloženo')
      } else {
        toast.error(result.message || 'Nepodařilo se uložit nastavení')
      }
    } catch (error) {
      console.error('Error saving company:', error)
      toast.error('Chyba při ukládání nastavení')
    } finally {
      setSaving(false)
    }
  }

  const handleUpgradePlan = async (planName: string) => {
    setUpgrading(true)
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.upgradeCompanyPlan(companyId, planName)

      if (result.success) {
        toast.success('Plán byl úspěšně upgradován')
        loadCompanyData()
      } else {
        toast.error(result.message || 'Nepodařilo se upgradovat plán')
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      toast.error('Chyba při upgradu plánu')
    } finally {
      setUpgrading(false)
    }
  }

  const getUsagePercentage = (current: number, max: number) => {
    if (max === -1) return 0 // Unlimited
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500'
    if (percentage < 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!company) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nepodařilo se načíst data firmy
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nastavení firmy</h1>
          <p className="text-muted-foreground">
            Spravujte základní informace, plán a nastavení vaší firmy
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          {company.company_plans.display_name}
        </Badge>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Základní údaje</TabsTrigger>
          <TabsTrigger value="usage">Využití a limity</TabsTrigger>
          <TabsTrigger value="plan">Plán a upgrade</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Základní informace
              </CardTitle>
              <CardDescription>
                Upravte základní údaje o vaší firmě
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Název firmy *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Název firmy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_name">Právní název</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name || ''}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="Právní název firmy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration_number">IČO</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number || ''}
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                    placeholder="12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_number">DIČ</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number || ''}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                    placeholder="CZ12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@firma.cz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+420 123 456 789"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Webové stránky</Label>
                <Input
                  id="website"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.firma.cz"
                />
              </div>

              <div className="space-y-4">
                <Label>Adresa</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    value={formData.address_line1 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    placeholder="Ulice a číslo popisné"
                  />
                  <Input
                    value={formData.address_line2 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    placeholder="Další řádek adresy (volitelné)"
                  />
                  <Input
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Město"
                  />
                  <Input
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="PSČ"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ukládám...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložit změny
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uživatelé</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.current_users_count}
                  {company.company_plans.max_users !== -1 && (
                    <span className="text-sm text-muted-foreground">
                      /{company.company_plans.max_users}
                    </span>
                  )}
                </div>
                <Progress 
                  value={getUsagePercentage(company.current_users_count, company.company_plans.max_users)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dokumenty (měsíc)</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.current_month_documents}
                  {company.company_plans.max_documents_per_month !== -1 && (
                    <span className="text-sm text-muted-foreground">
                      /{company.company_plans.max_documents_per_month}
                    </span>
                  )}
                </div>
                <Progress 
                  value={getUsagePercentage(company.current_month_documents, company.company_plans.max_documents_per_month)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Úložiště (GB)</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {company.current_storage_gb.toFixed(1)}
                  {company.company_plans.max_storage_gb !== -1 && (
                    <span className="text-sm text-muted-foreground">
                      /{company.company_plans.max_storage_gb}
                    </span>
                  )}
                </div>
                <Progress 
                  value={getUsagePercentage(company.current_storage_gb, company.company_plans.max_storage_gb)} 
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${company.company_plans.name === plan.name ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.display_name}
                    {company.company_plans.name === plan.name && (
                      <Badge variant="default">Aktuální</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {plan.monthly_price_czk === 0 ? 'Zdarma' : `${plan.monthly_price_czk} Kč`}
                    {plan.monthly_price_czk > 0 && (
                      <span className="text-sm text-muted-foreground">/měsíc</span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>👥 {plan.max_users === -1 ? 'Neomezeno' : plan.max_users} uživatelů</div>
                    <div>📄 {plan.max_documents_per_month === -1 ? 'Neomezeno' : plan.max_documents_per_month} dokumentů/měsíc</div>
                    <div>💾 {plan.max_storage_gb === -1 ? 'Neomezeno' : `${plan.max_storage_gb} GB`} úložiště</div>
                    {plan.has_approval_workflow && <div>✅ Schvalovací workflow</div>}
                    {plan.has_advanced_analytics && <div>📊 Pokročilé analýzy</div>}
                    {plan.has_api_access && <div>🔌 API přístup</div>}
                    {plan.has_priority_support && <div>🎯 Prioritní podpora</div>}
                  </div>

                  {company.company_plans.name !== plan.name && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgradePlan(plan.name)}
                      disabled={upgrading}
                    >
                      {upgrading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgradovat
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Schvalovací workflow
              </CardTitle>
              <CardDescription>
                Nastavte automatické schvalování dokumentů
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Povolit schvalovací workflow</Label>
                  <p className="text-sm text-muted-foreground">
                    Dokumenty budou vyžadovat schválení před zpracováním
                  </p>
                </div>
                <Switch
                  checked={formData.approval_workflow_enabled || false}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, approval_workflow_enabled: checked })
                  }
                  disabled={!company.company_plans.has_approval_workflow}
                />
              </div>

              {!company.company_plans.has_approval_workflow && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Schvalovací workflow není dostupné ve vašem aktuálním plánu. 
                    Upgradujte na vyšší plán pro aktivaci této funkce.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ukládám...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Uložit nastavení
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
