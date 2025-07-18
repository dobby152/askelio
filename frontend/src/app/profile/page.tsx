"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield, Edit } from "lucide-react"

export default function ProfilePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profil</h1>
          <p className="text-gray-600 dark:text-gray-400">Zobrazení a úprava vašeho profilu</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Základní informace */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Základní informace</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="/placeholder-user.jpg" alt="Jan Novák" />
                  <AvatarFallback className="text-lg">JN</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">Jan Novák</h3>
                  <p className="text-gray-600 dark:text-gray-400">jan.novak@example.com</p>
                  <Badge>Admin</Badge>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  <Edit className="w-4 h-4 mr-2" />
                  Upravit foto
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Křestní jméno</Label>
                  <Input id="firstName" defaultValue="Jan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Příjmení</Label>
                  <Input id="lastName" defaultValue="Novák" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="jan.novak@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" defaultValue="+420 123 456 789" />
                </div>
              </div>

              <Button>Uložit změny</Button>
            </CardContent>
          </Card>

          {/* Statistiky účtu */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiky účtu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Zpracované dokumenty</span>
                <span className="font-semibold">2,847</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Zbývající kredity</span>
                <span className="font-semibold">2,450</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Člen od</span>
                <span className="font-semibold">Leden 2024</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Poslední přihlášení</span>
                <span className="font-semibold">Dnes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
