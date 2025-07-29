'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { UserPlus, MoreHorizontal, Mail, Shield, Trash2, Edit, Users, Crown, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  full_name?: string
  is_active: boolean
  joined_at: string
  user_roles: {
    name: string
    display_name: string
    can_manage_company: boolean
    can_manage_users: boolean
    can_approve_documents: boolean
    can_view_analytics: boolean
  }
}

interface Role {
  id: string
  name: string
  display_name: string
  description: string
  can_manage_company: boolean
  can_manage_users: boolean
  can_upload_documents: boolean
  can_approve_documents: boolean
  can_view_analytics: boolean
  can_export_data: boolean
}

interface UserManagementProps {
  companyId: string
}

export default function UserManagement({ companyId }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [companyId])

  const loadUsers = async () => {
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.getCompanyDetails(companyId)

      if (result.success) {
        setUsers(result.data.company_users || [])
      } else {
        toast.error(result.message || 'Nepodařilo se načíst uživatele')
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Chyba při načítání uživatelů')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      // Roles are loaded from user_roles table - we'll need to create an endpoint for this
      // For now, use hardcoded roles
      setRoles([
        {
          id: '1',
          name: 'owner',
          display_name: 'Vlastník',
          description: 'Majitel firmy s plnými oprávněními',
          can_manage_company: true,
          can_manage_users: true,
          can_upload_documents: true,
          can_approve_documents: true,
          can_view_analytics: true,
          can_export_data: true
        },
        {
          id: '2',
          name: 'admin',
          display_name: 'Administrátor',
          description: 'Správce s rozšířenými oprávněními',
          can_manage_company: true,
          can_manage_users: true,
          can_upload_documents: true,
          can_approve_documents: true,
          can_view_analytics: true,
          can_export_data: true
        },
        {
          id: '3',
          name: 'manager',
          display_name: 'Manažer',
          description: 'Vedoucí s oprávněním schvalovat dokumenty',
          can_manage_company: false,
          can_manage_users: false,
          can_upload_documents: true,
          can_approve_documents: true,
          can_view_analytics: true,
          can_export_data: false
        },
        {
          id: '4',
          name: 'user',
          display_name: 'Uživatel',
          description: 'Standardní uživatel s přístupem k dokumentům',
          can_manage_company: false,
          can_manage_users: false,
          can_upload_documents: true,
          can_approve_documents: false,
          can_view_analytics: false,
          can_export_data: false
        },
        {
          id: '5',
          name: 'viewer',
          display_name: 'Prohlížeč',
          description: 'Pouze pro čtení dokumentů',
          can_manage_company: false,
          can_manage_users: false,
          can_upload_documents: false,
          can_approve_documents: false,
          can_view_analytics: false,
          can_export_data: false
        },
        {
          id: '6',
          name: 'accountant',
          display_name: 'Účetní',
          description: 'Specializovaná role pro finanční dokumenty',
          can_manage_company: false,
          can_manage_users: false,
          can_upload_documents: true,
          can_approve_documents: true,
          can_view_analytics: true,
          can_export_data: true
        }
      ])
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail || !inviteRole) {
      toast.error('Vyplňte všechna povinná pole')
      return
    }

    setInviting(true)
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.inviteUser(companyId, inviteEmail, inviteRole)

      if (result.success) {
        toast.success('Uživatel byl pozván')
        setShowInviteDialog(false)
        setInviteEmail('')
        setInviteRole('')
        loadUsers()
      } else {
        toast.error(result.message || 'Nepodařilo se pozvat uživatele')
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error('Chyba při pozývání uživatele')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.updateUserRole(companyId, userId, newRole)

      if (result.success) {
        toast.success('Role uživatele byla změněna')
        loadUsers()
      } else {
        toast.error(result.message || 'Nepodařilo se změnit roli')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      toast.error('Chyba při změně role')
    }
  }

  const handleRemoveUser = async (userId: string) => {
    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.removeUser(companyId, userId)

      if (result.success) {
        toast.success('Uživatel byl odebrán')
        loadUsers()
      } else {
        toast.error(result.message || 'Nepodařilo se odebrat uživatele')
      }
    } catch (error) {
      console.error('Error removing user:', error)
      toast.error('Chyba při odebírání uživatele')
    }
  }

  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'owner': return 'default'
      case 'admin': return 'secondary'
      case 'manager': return 'outline'
      case 'accountant': return 'outline'
      default: return 'outline'
    }
  }

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'owner': return <Crown className="h-3 w-3" />
      case 'admin': return <Shield className="h-3 w-3" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Správa uživatelů</h1>
          <p className="text-muted-foreground">
            Spravujte uživatele a jejich oprávnění ve vaší firmě
          </p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Pozvat uživatele
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pozvat nového uživatele</DialogTitle>
              <DialogDescription>
                Pošlete pozvánku novému uživateli do vaší firmy
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="uzivatel@email.cz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte roli" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.filter(role => role.name !== 'owner').map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.name)}
                          <div>
                            <div className="font-medium">{role.display_name}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Zrušit
              </Button>
              <Button onClick={handleInviteUser} disabled={inviting}>
                {inviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Pozývám...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Poslat pozvánku
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Uživatelé firmy
          </CardTitle>
          <CardDescription>
            Seznam všech uživatelů s přístupem do vaší firmy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ve firmě zatím nejsou žádní uživatelé. Pozvěte první uživatele pomocí tlačítka výše.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uživatel</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Oprávnění</TableHead>
                  <TableHead>Připojen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || user.email}</div>
                        {user.full_name && (
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.user_roles.name)} className="flex items-center gap-1 w-fit">
                        {getRoleIcon(user.user_roles.name)}
                        {user.user_roles.display_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_roles.can_manage_company && (
                          <Badge variant="outline" className="text-xs">Správa firmy</Badge>
                        )}
                        {user.user_roles.can_manage_users && (
                          <Badge variant="outline" className="text-xs">Správa uživatelů</Badge>
                        )}
                        {user.user_roles.can_approve_documents && (
                          <Badge variant="outline" className="text-xs">Schvalování</Badge>
                        )}
                        {user.user_roles.can_view_analytics && (
                          <Badge variant="outline" className="text-xs">Analýzy</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.joined_at).toLocaleDateString('cs-CZ')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Aktivní' : 'Neaktivní'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.user_roles.name !== 'owner' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              // TODO: Implement role change dialog
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Změnit roli
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Odebrat uživatele
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Odebrat uživatele</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Opravdu chcete odebrat uživatele {user.full_name || user.email} z firmy?
                                    Tato akce je nevratná.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveUser(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Odebrat
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dostupné role</CardTitle>
          <CardDescription>
            Přehled všech rolí a jejich oprávnění
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(role.name)}
                  <h3 className="font-semibold">{role.display_name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{role.description}</p>
                <div className="space-y-1">
                  {role.can_manage_company && (
                    <div className="text-xs text-green-600">✓ Správa firmy</div>
                  )}
                  {role.can_manage_users && (
                    <div className="text-xs text-green-600">✓ Správa uživatelů</div>
                  )}
                  {role.can_upload_documents && (
                    <div className="text-xs text-green-600">✓ Nahrávání dokumentů</div>
                  )}
                  {role.can_approve_documents && (
                    <div className="text-xs text-green-600">✓ Schvalování dokumentů</div>
                  )}
                  {role.can_view_analytics && (
                    <div className="text-xs text-green-600">✓ Zobrazení analýz</div>
                  )}
                  {role.can_export_data && (
                    <div className="text-xs text-green-600">✓ Export dat</div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
