"use client"

import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Shield, Mail } from "lucide-react"

export default function UsersPage() {
  const users = [
    {
      id: 1,
      name: "Jan Novák",
      email: "jan.novak@example.com",
      role: "Admin",
      status: "Aktivní",
      lastLogin: "2025-01-17"
    },
    {
      id: 2,
      name: "Marie Svobodová",
      email: "marie.svobodova@example.com",
      role: "Editor",
      status: "Aktivní",
      lastLogin: "2025-01-16"
    },
    {
      id: 3,
      name: "Petr Dvořák",
      email: "petr.dvorak@example.com",
      role: "Viewer",
      status: "Neaktivní",
      lastLogin: "2025-01-10"
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Uživatelé</h1>
            <p className="text-gray-600 dark:text-gray-400">Správa uživatelských účtů</p>
          </div>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Přidat uživatele
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>{user.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <Badge variant={user.role === "Admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={user.status === "Aktivní" ? "default" : "destructive"}>
                    {user.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Poslední přihlášení: {user.lastLogin}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
