"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Check, AlertCircle, Edit } from "lucide-react"
import { toast } from "sonner"

interface Company {
  id: string
  name: string
  legal_name?: string
  registration_number?: string // IČO
  tax_number?: string // DIČ
  vat_number?: string
  address_line1?: string
  address_line2?: string
  city?: string
  postal_code?: string
  country: string
  email?: string
  phone?: string
  website?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CompanyProfileSetupProps {
  onProfileUpdated?: () => void
}

export function CompanyProfileSetup({ onProfileUpdated }: CompanyProfileSetupProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    legal_name: "",
    registration_number: "",
    tax_number: "",
    vat_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    country: "CZ",
    email: "",
    phone: "",
    website: ""
  })

  useEffect(() => {
    loadCompany()
  }, [])

  const loadCompany = async () => {
    try {
      setIsLoading(true)
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.getUserCompanies()

      if (result.success && result.data && result.data.length > 0) {
        // Get the first company (user's company)
        const userCompany = result.data[0].companies
        setCompany(userCompany)

        // Pre-fill form with existing data
        setFormData({
          name: userCompany.name || "",
          legal_name: userCompany.legal_name || "",
          registration_number: userCompany.registration_number || "",
          tax_number: userCompany.tax_number || "",
          vat_number: userCompany.vat_number || "",
          address_line1: userCompany.address_line1 || "",
          address_line2: userCompany.address_line2 || "",
          city: userCompany.city || "",
          postal_code: userCompany.postal_code || "",
          country: userCompany.country || "CZ",
          email: userCompany.email || "",
          phone: userCompany.phone || "",
          website: userCompany.website || ""
        })
      }
    } catch (error) {
      console.error('Error loading company:', error)
      toast.error('Chyba při načítání firemních údajů')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!company) {
      toast.error('Firma nebyla nalezena')
      return
    }

    setIsLoading(true)

    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.updateCompany(company.id, formData)

      if (result.success) {
        toast.success('Firemní údaje byly aktualizovány')
        setCompany(result.data)
        setShowForm(false)
        onProfileUpdated?.()
      } else {
        toast.error(result.message || 'Chyba při ukládání údajů')
      }
    } catch (error) {
      console.error('Error saving company:', error)
      toast.error('Chyba při ukládání údajů')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setShowForm(true)
  }

  if (isLoading && !company) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Načítání firemních údajů...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Firemní údaje
          </CardTitle>
          <CardDescription>
            Nastavte své firemní údaje pro automatické rozpoznávání směru faktur
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!company ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nebyla nalezena žádná firma. Kontaktujte podporu.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{company.name}</h3>
                      <Badge variant="default">Aktivní</Badge>
                    </div>
                    {company.registration_number && (
                      <p className="text-sm text-muted-foreground">
                        IČO: {company.registration_number}
                      </p>
                    )}
                    {company.tax_number && (
                      <p className="text-sm text-muted-foreground">
                        DIČ: {company.tax_number}
                      </p>
                    )}
                    {company.address_line1 && (
                      <p className="text-sm text-muted-foreground">
                        📍 {company.address_line1}, {company.city}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Upravit údaje
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              Upravit firemní údaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Název firmy *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legal_name">Právní název</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="registration_number">IČO</Label>
                  <Input
                    id="registration_number"
                    value={formData.registration_number}
                    onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_number">DIČ</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({...formData, tax_number: e.target.value})}
                    placeholder="CZ12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="vat_number">VAT ID</Label>
                  <Input
                    id="vat_number"
                    value={formData.vat_number}
                    onChange={(e) => setFormData({...formData, vat_number: e.target.value})}
                    placeholder="CZ12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="address_line1">Adresa</Label>
                  <Input
                    id="address_line1"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({...formData, address_line1: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Město</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">PSČ</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Ukládání...' : 'Uložit změny'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Zrušit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
