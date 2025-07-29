'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { CheckCircle, XCircle, Clock, FileText, User, Calendar, MessageSquare, AlertCircle, Loader2, Eye, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface ApprovalStep {
  id: string
  step_number: number
  approver_id: string
  approver_name: string
  approver_email: string
  status: 'pending' | 'approved' | 'rejected'
  approved_at?: string
  comment?: string
}

interface Approval {
  id: string
  document_id: string
  document_name: string
  document_type: string
  requester_id: string
  requester_name: string
  requester_email: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  completed_at?: string
  current_step: number
  total_steps: number
  approval_steps: ApprovalStep[]
}

interface ApprovalWorkflowProps {
  companyId: string
}

export default function ApprovalWorkflow({ companyId }: ApprovalWorkflowProps) {
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [comment, setComment] = useState('')
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

  useEffect(() => {
    if (companyId) {
      loadApprovals()
      loadPendingApprovals()
    }
  }, [companyId])

  const loadApprovals = async () => {
    if (!companyId) return

    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.get(`/api/approvals/?company_id=${companyId}`)

      if (result.success) {
        setApprovals(result.data || [])
      } else {
        toast.error(result.message || 'Nepodařilo se načíst schválení')
      }
    } catch (error) {
      console.error('Error loading approvals:', error)
      toast.error('Chyba při načítání schválení')
    } finally {
      setLoading(false)
    }
  }

  const loadPendingApprovals = async () => {
    if (!companyId) return

    try {
      const { apiClient } = await import('@/lib/api-client')
      const result = await apiClient.get(`/api/approvals/pending?company_id=${companyId}`)

      if (result.success) {
        setPendingApprovals(result.data || [])
      }
    } catch (error) {
      console.error('Error loading pending approvals:', error)
    }
  }

  const handleApprovalAction = async () => {
    if (!selectedApproval) return

    setProcessing(selectedApproval.id)
    try {
      const { apiClient } = await import('@/lib/api-client')
      const endpoint = actionType === 'approve' ? 'approve' : 'reject'
      const result = await apiClient.post(`/api/approvals/${selectedApproval.id}/${endpoint}`, {
        comment: comment || undefined
      })

      if (result.success) {
        toast.success(actionType === 'approve' ? 'Dokument byl schválen' : 'Dokument byl zamítnut')
        setShowApprovalDialog(false)
        setComment('')
        setSelectedApproval(null)
        loadApprovals()
        loadPendingApprovals()
      } else {
        toast.error(result.message || 'Nepodařilo se zpracovat akci')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Chyba při zpracování schválení')
    } finally {
      setProcessing(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="mr-1 h-3 w-3" />Čeká</Badge>
      case 'approved':
        return <Badge variant="default" className="text-green-600"><CheckCircle className="mr-1 h-3 w-3" />Schváleno</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Zamítnuto</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const canUserApprove = (approval: Approval) => {
    const currentUserId = localStorage.getItem('user_id') // Assuming we store user ID
    const currentStep = approval.approval_steps.find(step => step.step_number === approval.current_step)
    return currentStep && currentStep.approver_id === currentUserId && currentStep.status === 'pending'
  }

  const openApprovalDialog = (approval: Approval, action: 'approve' | 'reject') => {
    setSelectedApproval(approval)
    setActionType(action)
    setShowApprovalDialog(true)
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
          <h1 className="text-3xl font-bold tracking-tight">Schvalovací workflow</h1>
          <p className="text-muted-foreground">
            Spravujte schvalování dokumentů a sledujte průběh workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            {pendingApprovals.length} čeká na schválení
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Čekající schválení ({pendingApprovals.length})</TabsTrigger>
          <TabsTrigger value="all">Všechna schválení ({approvals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Dokumenty čekající na vaše schválení
              </CardTitle>
              <CardDescription>
                Dokumenty, které vyžadují vaše schválení pro pokračování ve workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Momentálně nemáte žádné dokumenty čekající na schválení.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dokument</TableHead>
                      <TableHead>Žadatel</TableHead>
                      <TableHead>Krok</TableHead>
                      <TableHead>Vytvořeno</TableHead>
                      <TableHead>Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{approval.document_name}</div>
                              <div className="text-sm text-muted-foreground">{approval.document_type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{approval.requester_name}</div>
                              <div className="text-sm text-muted-foreground">{approval.requester_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            Krok {approval.current_step} z {approval.total_steps}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(approval.created_at).toLocaleDateString('cs-CZ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // TODO: Open document preview
                              }}
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              Zobrazit
                            </Button>
                            {canUserApprove(approval) && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => openApprovalDialog(approval, 'approve')}
                                  disabled={processing === approval.id}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Schválit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => openApprovalDialog(approval, 'reject')}
                                  disabled={processing === approval.id}
                                >
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Zamítnout
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Všechna schválení
              </CardTitle>
              <CardDescription>
                Historie všech schvalovacích procesů ve vaší firmě
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvals.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Zatím nebyly vytvořeny žádné schvalovací procesy.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dokument</TableHead>
                      <TableHead>Žadatel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Průběh</TableHead>
                      <TableHead>Vytvořeno</TableHead>
                      <TableHead>Dokončeno</TableHead>
                      <TableHead>Akce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{approval.document_name}</div>
                              <div className="text-sm text-muted-foreground">{approval.document_type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{approval.requester_name}</div>
                              <div className="text-sm text-muted-foreground">{approval.requester_email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(approval.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {approval.approval_steps.map((step, index) => (
                              <div key={step.id} className="flex items-center">
                                {getStepStatusIcon(step.status)}
                                {index < approval.approval_steps.length - 1 && (
                                  <div className="w-4 h-px bg-gray-300 mx-1" />
                                )}
                              </div>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              {approval.current_step}/{approval.total_steps}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(approval.created_at).toLocaleDateString('cs-CZ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {approval.completed_at ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(approval.completed_at).toLocaleDateString('cs-CZ')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="mr-1 h-3 w-3" />
                                Detail
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detail schvalovacího procesu</DialogTitle>
                                <DialogDescription>
                                  {approval.document_name} - {approval.document_type}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Základní informace</h4>
                                    <div className="space-y-1 text-sm">
                                      <div><strong>Status:</strong> {getStatusBadge(approval.status)}</div>
                                      <div><strong>Žadatel:</strong> {approval.requester_name}</div>
                                      <div><strong>Vytvořeno:</strong> {new Date(approval.created_at).toLocaleString('cs-CZ')}</div>
                                      {approval.completed_at && (
                                        <div><strong>Dokončeno:</strong> {new Date(approval.completed_at).toLocaleString('cs-CZ')}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Průběh schvalování</h4>
                                    <div className="space-y-2">
                                      {approval.approval_steps.map((step) => (
                                        <div key={step.id} className="flex items-center gap-2 text-sm">
                                          {getStepStatusIcon(step.status)}
                                          <div className="flex-1">
                                            <div className="font-medium">{step.approver_name}</div>
                                            <div className="text-muted-foreground">{step.approver_email}</div>
                                            {step.approved_at && (
                                              <div className="text-xs text-muted-foreground">
                                                {new Date(step.approved_at).toLocaleString('cs-CZ')}
                                              </div>
                                            )}
                                            {step.comment && (
                                              <div className="text-xs bg-muted p-2 rounded mt-1">
                                                <MessageSquare className="inline h-3 w-3 mr-1" />
                                                {step.comment}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Schválit dokument' : 'Zamítnout dokument'}
            </DialogTitle>
            <DialogDescription>
              {selectedApproval && (
                <>
                  {actionType === 'approve' ? 'Schvalujete' : 'Zamítáte'} dokument "{selectedApproval.document_name}".
                  {actionType === 'reject' && ' Prosím uveďte důvod zamítnutí.'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="comment" className="text-sm font-medium">
                Komentář {actionType === 'reject' ? '(povinný)' : '(volitelný)'}
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={actionType === 'approve' ? 'Volitelný komentář...' : 'Důvod zamítnutí...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Zrušit
            </Button>
            <Button
              onClick={handleApprovalAction}
              disabled={processing !== null || (actionType === 'reject' && !comment.trim())}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : actionType === 'approve' ? (
                <CheckCircle className="mr-2 h-4 w-4" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              {actionType === 'approve' ? 'Schválit' : 'Zamítnout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
