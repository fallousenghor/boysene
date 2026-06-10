import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Receipt, MoreHorizontal, Eye, XCircle, Download, MessageCircle, Check, DollarSign } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, statusConfig, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, EmptyState } from '@/components/ui/index'
import { ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { toast } from '@/store/ui.store'
import SaleForm from './SaleForm'
import SaleDetail from './SaleDetail'

// Configuration pour les nouveaux statuts
const STATUS_CONFIG: Record<string, { label: string; class: string; color: string }> = {
  DRAFT: { label: 'Brouillon', class: 'bg-gray-100 text-gray-800 border-gray-300', color: 'gray' },
  CONFIRMED: { label: 'Confirmée', class: 'bg-blue-100 text-blue-800 border-blue-300', color: 'blue' },
  PARTIAL_PAID: { label: 'Partiellement payée', class: 'bg-yellow-100 text-yellow-800 border-yellow-300', color: 'yellow' },
  FULLY_PAID: { label: 'Entièrement payée', class: 'bg-green-100 text-green-800 border-green-300', color: 'green' },
  CANCELLED: { label: 'Annulée', class: 'bg-red-100 text-red-800 border-red-300', color: 'red' },
}

export default function Sales() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const qc = useQueryClient()
  const navigate = useNavigate()

  // Requête API avec recherche et filtrage
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['sales', page, search, filterStatus],
    queryFn: async () => {
      const res = await api.get('/sales', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          status: filterStatus || undefined,
        },
      })
      return res.data
    },
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/sales/${id}/cancel`),
    onSuccess: () => {
      toast.success('Vente annulée')
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Impossible d\'annuler'),
  })

  const confirmMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post(`/sales/${id}/confirm`, { amountPaid: amount }),
    onSuccess: () => {
      toast.success('Vente confirmée')
      qc.invalidateQueries({ queryKey: ['sales'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur confirmation'),
  })

  const downloadPdf = async (saleId: string) => {
    try {
      const res = await api.get(`/invoices/sale/${saleId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `facture-${saleId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF téléchargé')
    } catch {
      toast.error('Erreur génération PDF')
    }
  }

  const sendWhatsApp = async (saleId: string) => {
    try {
      await api.post(`/whatsapp/sale/${saleId}`)
      toast.success('Facture envoyée par WhatsApp !')
    } catch {
      toast.error('Erreur envoi WhatsApp')
    }
  }

  const sales = Array.isArray(data) ? data : data?.data || []
  const meta = Array.isArray(data) ? { total: data.length, pages: 1 } : data?.meta || {}

  // Déterminer quelles actions sont possibles selon le statut
  const getAvailableActions = (sale: any) => {
    const status = sale.status
    return {
      canEdit: status === 'DRAFT',
      canConfirm: status === 'DRAFT',
      canPay: ['CONFIRMED', 'PARTIAL_PAID'].includes(status),
      canCancel: status !== 'FULLY_PAID' && status !== 'CANCELLED',
      canDownloadPdf: !['DRAFT'].includes(status),
      canSendWhatsApp: !['DRAFT'].includes(status),
    }
  }

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT
    return (
      <span className={cn('text-xs px-2.5 py-1 rounded-md border font-medium', config.class)}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-5">
      {/* En-tête avec bouton d'ajout */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ventes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.total || 0} ventes enregistrées</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/checkout')}>
            <ShoppingCart className="h-4 w-4" /> Checkout rapide
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Nouvelle vente
          </Button>
        </div>
      </div>

      <Card>
        {/* Barre de recherche et filtres */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Référence, client..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
            />
          </div>

          {/* Filtre par statut */}
          <select
            value={filterStatus || ''}
            onChange={(e) => {
              setFilterStatus(e.target.value || null)
              setPage(1)
            }}
            className="h-8 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/60"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          {isFetching && <Spinner className="h-4 w-4" />}
        </div>

        {/* Contenu principal */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Spinner className="h-6 w-6" />
          </div>
        ) : sales.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="Aucune vente"
            description="Créez votre première vente."
            action={
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" /> Nouvelle vente
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Reste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s: any) => {
                  const actions = getAvailableActions(s)
                  return (
                    <TableRow key={s.id} className="hover:bg-muted transition-colors">
                      <TableCell>
                        <span className="font-mono text-xs text-primary font-semibold">{s.reference}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {s.customer?.name || (
                            <em className="text-muted-foreground not-italic text-xs">Comptant</em>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{formatDate(s.saleDate)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono font-bold">{formatCurrency(s.total)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-success">{formatCurrency(s.amountPaid)}</span>
                      </TableCell>
                      <TableCell>
                        {s.amountDue > 0 ? (
                          <span className="text-sm font-mono text-destructive font-semibold">
                            {formatCurrency(s.amountDue)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewId(s.id)}>
                              <Eye className="h-4 w-4" /> Détails
                            </DropdownMenuItem>

                            {/* Actions selon statut */}
                            {actions.canEdit && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setViewId(s.id)
                                }}
                              >
                                ✏️ Modifier le brouillon
                              </DropdownMenuItem>
                            )}

                            {actions.canConfirm && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    confirmMutation.mutate({ id: s.id, amount: 0 })
                                  }
                                  className="text-blue-600"
                                >
                                  <Check className="h-4 w-4" /> Confirmer la vente
                                </DropdownMenuItem>
                              </>
                            )}

                            {actions.canPay && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setViewId(s.id)}
                                  className="text-green-600"
                                >
                                  <DollarSign className="h-4 w-4" /> Enregistrer un paiement
                                </DropdownMenuItem>
                              </>
                            )}

                            {actions.canDownloadPdf && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => downloadPdf(s.id)}>
                                  <Download className="h-4 w-4" /> Télécharger PDF
                                </DropdownMenuItem>
                              </>
                            )}

                            {actions.canSendWhatsApp && (
                              <DropdownMenuItem onClick={() => sendWhatsApp(s.id)}>
                                <MessageCircle className="h-4 w-4" /> Envoyer WhatsApp
                              </DropdownMenuItem>
                            )}

                            {actions.canCancel && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  destructive
                                  onClick={() => cancelMutation.mutate(s.id)}
                                >
                                  <XCircle className="h-4 w-4" /> Annuler la vente
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={meta.pages || 1} total={meta.total || 0} limit={15} onPageChange={setPage} />
          </>
        )}
      </Card>

      {showForm && <SaleForm onClose={() => setShowForm(false)} />}
      {viewId && <SaleDetail saleId={viewId} onClose={() => setViewId(null)} />}
    </div>
  )
}
