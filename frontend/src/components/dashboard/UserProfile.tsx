'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  Settings, 
  Save,
  Edit,
  Camera,
  Globe,
  CreditCard
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { toast } from 'sonner'

interface UserStats {
  total_documents: number
  documents_this_month: number
  total_credits_used: number
  credits_used_this_month: number
  member_since: string
}

export function UserProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    preferred_language: 'cs',
    preferred_currency: 'CZK'
  })
  const { user, updateProfile } = useAuth()

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        preferred_language: (user as any).preferred_language || 'cs',
        preferred_currency: (user as any).preferred_currency || 'CZK'
      })
      fetchUserStats()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockStats: UserStats = {
        total_documents: 15,
        documents_this_month: 3,
        total_credits_used: (user as any)?.total_credits_used || 0,
        credits_used_this_month: 0.45,
        member_since: (user as any)?.created_at || new Date().toISOString()
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const result = await updateProfile({
        full_name: formData.full_name,
        preferred_language: formData.preferred_language as 'cs' | 'en' | 'sk',
        preferred_currency: formData.preferred_currency as 'CZK' | 'EUR' | 'USD'
      })

      if (result.success) {
        setIsEditing(false)
        toast.success('Profil byl úspěšně aktualizován!')
      } else {
        toast.error(result.error || 'Nepodařilo se aktualizovat profil')
      }
    } catch (error) {
      toast.error('Došlo k neočekávané chybě')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        preferred_language: (user as any).preferred_language || 'cs',
        preferred_currency: (user as any).preferred_currency || 'CZK'
      })
    }
    setIsEditing(false)
  }

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
      case 'basic':
        return <Badge variant="secondary"><CreditCard className="h-3 w-3 mr-1" />Basic</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
  }

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'en': return 'English'
      case 'sk': return 'Slovenčina'
      default: return 'Čeština'
    }
  }

  const getCurrencyLabel = (currency: string) => {
    switch (currency) {
      case 'EUR': return 'Euro (€)'
      case 'USD': return 'US Dollar ($)'
      default: return 'Česká koruna (Kč)'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground">Načítání profilu...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Můj profil
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Upravit
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Spravujte své osobní údaje a nastavení
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Basic Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={(user as any).avatar_url || ''} />
                <AvatarFallback className="text-lg">
                  {getInitials(user.full_name || user.email)}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold">
                  {user.full_name || 'Uživatel'}
                </h3>
                {getSubscriptionBadge(user.subscription_tier)}
              </div>
              <p className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="h-4 w-4" />
                Člen od {formatDate((user as any).created_at)}
              </p>
            </div>
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Celé jméno</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled={true}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email nelze změnit
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Jazyk</Label>
              <select
                id="language"
                value={formData.preferred_language}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_language: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50"
              >
                <option value="cs">Čeština</option>
                <option value="en">English</option>
                <option value="sk">Slovenčina</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Měna</Label>
              <select
                id="currency"
                value={formData.preferred_currency}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_currency: e.target.value }))}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50"
              >
                <option value="CZK">Česká koruna (Kč)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">US Dollar ($)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Ukládám...' : 'Uložit změny'}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Zrušit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Card */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiky účtu</CardTitle>
            <CardDescription>
              Přehled vaší aktivity na platformě
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.total_documents}
                </div>
                <p className="text-sm text-muted-foreground">
                  Celkem dokumentů
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.documents_this_month}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tento měsíc
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total_credits_used.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Celkem kreditů
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.credits_used_this_month.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tento měsíc
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
