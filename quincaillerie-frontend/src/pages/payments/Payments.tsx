// ── PAYMENTS ──────────────────────────────────────────────
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CreditCard, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { api, extractData, extractList, extractMeta, extractSummary } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Card, Spinner, EmptyState } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { StatCard } from '@/components/charts/StatCard'

const METHOD_LABELS: Record<string, string> = { CASH:'Espèces', WAVE:'Wave', ORANGE_MONEY:'Orange Money', BANK_CARD:'Carte', CREDIT:'Crédit', BANK_TRANSFER:'Virement' }
const TYPE_COLORS: Record<string, string> = { INCOME:'text-success', EXPENSE:'text-destructive', REFUND:'text-warning' }
const TYPE_LABELS: Record<string, string> = { INCOME:'Entrée', EXPENSE:'Sortie', REFUND:'Remboursement' }

export default function Payments() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: async () => {
      const r = await api.get('/payments', { params: { page, limit: 20 } })
      return { data: extractList<any>(r), meta: extractMeta(r), summary: extractSummary(r) }
    },
  })
  const { data: summary } = useQuery({ queryKey: ['payments-summary'], queryFn: async () => { const r = await api.get('/payments/summary'); return extractData<any>(r) } })

  const items = data?.data || []; const meta = data?.meta || {}
  const totalAmount = data?.summary?.totalAmount || 0

  return (
    <div className="space-y-5">
      <div><h2 className="text-lg font-semibold">Paiements</h2><p className="text-xs text-muted-foreground">{meta.total || 0} transactions</p></div>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard title="Total encaissé" value={summary.totalIncome || 0} isCurrency icon={<TrendingUp className="h-5 w-5" />} colorClass="text-success" />
          <StatCard title="Total décaissé" value={summary.totalExpense || 0} isCurrency icon={<TrendingDown className="h-5 w-5" />} colorClass="text-destructive" />
          <StatCard title="Solde net" value={summary.balance || 0} isCurrency icon={<DollarSign className="h-5 w-5" />} colorClass="text-primary" />
        </div>
      )}
      <Card>
        {isLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? <EmptyState icon={<CreditCard className="h-6 w-6" />} title="Aucun paiement" />
          : (<>
            <Table>
              <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>Type</TableHead><TableHead>Mode</TableHead><TableHead>Montant</TableHead><TableHead>Client/Fournisseur</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell><span className="font-mono text-xs text-muted-foreground">{p.reference}</span></TableCell>
                    <TableCell><span className={cn('text-xs font-semibold', TYPE_COLORS[p.type])}>{TYPE_LABELS[p.type] || p.type}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{METHOD_LABELS[p.method] || p.method}</span></TableCell>
                    <TableCell><span className={cn('text-sm font-mono font-bold', TYPE_COLORS[p.type])}>{p.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(p.amount)}</span></TableCell>
                    <TableCell><span className="text-sm">{p.customer?.name || p.supplier?.name || '—'}</span></TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={meta.pages || 1} total={meta.total || 0} limit={20} onPageChange={setPage} />
          </>)}
      </Card>
    </div>
  )
}
