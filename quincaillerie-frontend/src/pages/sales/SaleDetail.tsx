import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, extractData } from '@/lib/api'
import { formatCurrency, formatDate, statusConfig, cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Spinner, Separator } from '@/components/ui/index'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Download, MessageCircle, CreditCard, Package } from 'lucide-react'
import { toast } from '@/store/ui.store'

const PAYMENT_LABELS: Record<string, string> = { CASH: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', BANK_CARD: 'Carte', CREDIT: 'Crédit' }

export default function SaleDetail({ saleId, onClose }: { saleId: string; onClose: () => void }) {
  const [payAmount, setPayAmount] = useState(0)
  const [payMethod, setPayMethod] = useState('CASH')
  const qc = useQueryClient()

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', saleId],
    queryFn: async () => { const r = await api.get(`/sales/${saleId}`); return extractData<any>(r) },
  })

  const payMutation = useMutation({
    mutationFn: () => api.post(`/sales/${saleId}/payment`, { amount: payAmount, method: payMethod }),
    onSuccess: () => {
      toast.success('Paiement enregistré')
      qc.invalidateQueries({ queryKey: ['sale', saleId] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      setPayAmount(0)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/invoices/sale/${saleId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `facture-${saleId}.pdf`; a.click(); URL.revokeObjectURL(url)
    } catch { toast.error('Erreur PDF') }
  }

  const sendWA = async () => {
    try { await api.post(`/whatsapp/sale/${saleId}`); toast.success('Envoyé !') }
    catch { toast.error('Erreur WhatsApp') }
  }

  if (isLoading) return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Chargement de la vente</DialogTitle>
          <DialogDescription>Récupération des détails de la vente.</DialogDescription>
        </DialogHeader>
        <div className="h-40 flex items-center justify-center"><Spinner /></div>
      </DialogContent>
    </Dialog>
  )
  if (!sale) return null

  const sc = statusConfig[sale.status] || {}
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vente · {sale.reference}</DialogTitle>
            <DialogDescription className="sr-only">Détails, paiements et actions de la vente.</DialogDescription>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs px-2 py-1 rounded-md border font-semibold', sc.class)}>{sc.label}</span>
              <Button variant="outline" size="sm" onClick={downloadPdf}><Download className="h-3.5 w-3.5" /> PDF</Button>
              {sale.customer?.whatsapp && <Button variant="outline" size="sm" onClick={sendWA}><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</Button>}
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Client</p>
              <p className="font-medium">{sale.customer?.name || 'Comptant'}</p>
              {sale.customer?.phone && <p className="text-xs text-muted-foreground">{sale.customer.phone}</p>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Date</p>
              <p className="font-medium">{formatDate(sale.createdAt)}</p>
              <p className="text-xs text-muted-foreground">Par: {sale.user?.firstName} {sale.user?.lastName}</p>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Articles</p>
            <div className="space-y-2">
              {sale.items?.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.product?.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} × {item.quantity} {item.product?.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">{formatCurrency(item.total)}</p>
                    {item.discount > 0 && <p className="text-xs text-muted-foreground">-{item.discount}%</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-mono">{formatCurrency(sale.subtotal)}</span></div>
            {sale.taxRate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">TVA ({sale.taxRate}%)</span><span className="font-mono">{formatCurrency(sale.taxAmount)}</span></div>}
            {sale.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span className="font-mono text-success">-{formatCurrency(sale.discount)}</span></div>}
            <Separator />
            <div className="flex justify-between font-bold"><span>Total</span><span className="font-mono text-base">{formatCurrency(sale.total)}</span></div>
            <div className="flex justify-between text-success"><span>Payé</span><span className="font-mono">{formatCurrency(sale.amountPaid)}</span></div>
            {sale.amountDue > 0 && <div className="flex justify-between text-destructive font-semibold"><span>Reste dû</span><span className="font-mono">{formatCurrency(sale.amountDue)}</span></div>}
          </div>

          {/* Add payment */}
          {sale.amountDue > 0 && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Ajouter un paiement</p>
              <div className="flex gap-3">
                <input type="number" min="0" max={sale.amountDue} value={payAmount || ''}
                  onChange={(e) => setPayAmount(+e.target.value)}
                  placeholder={`Max: ${formatCurrency(sale.amountDue)}`}
                  className="flex-1 h-9 px-3 rounded-lg bg-input border border-border text-sm font-mono focus:outline-none focus:border-primary/60" />
                <Select onValueChange={setPayMethod} defaultValue="CASH">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={() => payMutation.mutate()} loading={payMutation.isPending} disabled={payAmount <= 0} size="sm">
                  Payer
                </Button>
              </div>
            </div>
          )}

          {/* Payment history */}
          {sale.payments?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Historique paiements</p>
              <div className="space-y-1.5">
                {sale.payments.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-sm p-2 rounded-lg bg-secondary/30">
                    <span className="text-muted-foreground">{formatDate(p.createdAt)} · {PAYMENT_LABELS[p.method] || p.method}</span>
                    <span className="font-mono font-semibold text-success">+{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
