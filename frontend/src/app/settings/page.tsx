"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Shield, Palette } from "lucide-react"

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nastavení</h1>
          <p className="text-gray-600 dark:text-gray-400">Upravte své preference a nastavení účtu</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profil</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Jméno</Label>
                <Input id="name" defaultValue="Jan Novák" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="jan.novak@example.com" />
              </div>
              <Button className="w-full">Uložit změny</Button>
            </CardContent>
          </Card>

          {/* Notifikace */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifikace</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email notifikace</Label>
                <Switch id="email-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push notifikace</Label>
                <Switch id="push-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="document-notifications">Dokument zpracován</Label>
                <Switch id="document-notifications" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="credit-notifications">Nízký stav kreditů</Label>
                <Switch id="credit-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Zabezpečení */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Zabezpečení</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Současné heslo</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nové heslo</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Potvrdit heslo</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor">Dvoufaktorové ověření</Label>
                <Switch id="two-factor" />
              </div>
              <Button className="w-full">Změnit heslo</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
