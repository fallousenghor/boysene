import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart3, Download, TrendingUp, ShoppingCart, Package, Users, CreditCard } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { api, extractData, extractSummary } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui/index'
import { toast } from '@/store/ui.store'

const REPORT_TABS = [
  { id: 'sales', label: 'Ventes', icon: TrendingUp },
  { id: 'purchases', label: 'Achats', icon: ShoppingCart },
  { id: 'stock', label: 'Stock', icon: Package },
  { id: 'customers', label: 'Clients', icon: Users },
  { id: 'profit-loss', label: 'P&L', icon: CreditCard },
]

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const params = { startDate: startDate || undefined, endDate: endDate || undefined }

  const { data, isLoading } = useQuery({
    queryKey: ['report', activeTab, startDate, endDate],
    queryFn: async () => {
      const r = await api.get(`/reports/${activeTab}`, { params })
      const payload = extractData<any>(r)
      const summary = extractSummary(r)
      return Array.isArray(payload) ? { data: payload, summary } : payload
    },
  })

  const exportExcel = async () => {
    try {
      const res = await api.get(`/reports/${activeTab}/export/excel`, { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `rapport-${activeTab}-${Date.now()}.xlsx`; a.click(); URL.revokeObjectURL(url)
      toast.success('Export Excel téléchargé')
    } catch { toast.error('Erreur export') }
  }

  const summary = data?.summary || {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Rapports</h2><p className="text-xs text-muted-foreground">Analyses et statistiques détaillées</p></div>
        <Button variant="outline" onClick={exportExcel}><Download className="h-4 w-4" /> Exporter Excel</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Du</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="h-8 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/60" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground whitespace-nowrap">Au</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="h-8 px-3 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:border-primary/60" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl w-fit">
        {REPORT_TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', activeTab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              <Icon className="h-3.5 w-3.5" />{t.label}
            </button>
          )
        })}
      </div>

      {isLoading ? <div className="h-64 flex items-center justify-center"><Spinner className="h-6 w-6" /></div>
        : (
          <div className="space-y-4">
            {/* Summary cards */}
            {activeTab === 'sales' && summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total ventes', value: summary.totalSales, isCurrency: false },
                  { label: 'Chiffre d\'affaires', value: summary.totalRevenue, isCurrency: true },
                  { label: 'Montant payé', value: summary.totalPaid, isCurrency: true },
                  { label: 'Reste à encaisser', value: summary.totalDue, isCurrency: true },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <p className="text-2xl font-bold font-mono">{s.isCurrency ? formatCurrency(s.value || 0) : (s.value || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'profit-loss' && data && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Chiffre d\'affaires', value: data.revenue || 0, color: 'text-primary' },
                  { label: 'Coût des achats', value: data.cogs || 0, color: 'text-warning' },
                  { label: 'Bénéfice brut', value: data.grossProfit || 0, color: 'text-success' },
                  { label: 'Marge brute', value: `${data.margin || 0}%`, color: 'text-accent', raw: true },
                ].map((s, i) => (
                  <div key={i} className="stat-card">
                    <p className={cn('text-2xl font-bold font-mono', s.color)}>{s.raw ? s.value : formatCurrency(s.value as number)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Data table */}
            {activeTab === 'sales' && data?.data && (
              <Card>
                <CardHeader><CardTitle>Détail des ventes</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm data-table">
                    <thead><tr><th>Référence</th><th>Date</th><th>Client</th><th>Total</th><th>Payé</th><th>Reste</th><th>Statut</th></tr></thead>
                    <tbody>
                      {data.data.slice(0, 50).map((s: any) => (
                        <tr key={s.id}>
                          <td className="font-mono text-xs text-primary">{s.reference}</td>
                          <td className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</td>
                          <td>{s.customer?.name || '—'}</td>
                          <td className="font-mono font-bold">{formatCurrency(s.total)}</td>
                          <td className="font-mono text-success">{formatCurrency(s.amountPaid)}</td>
                          <td className={cn('font-mono', s.amountDue > 0 ? 'text-destructive' : 'text-muted-foreground')}>{s.amountDue > 0 ? formatCurrency(s.amountDue) : '—'}</td>
                          <td><span className="text-xs px-1.5 py-0.5 bg-secondary rounded">{s.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'stock' && data?.products && (
              <Card>
                <CardHeader><CardTitle>État des stocks</CardTitle></CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm data-table">
                    <thead><tr><th>Produit</th><th>Catégorie</th><th>Stock</th><th>Min</th><th>P. Achat</th><th>P. Vente</th><th>Valeur</th></tr></thead>
                    <tbody>
                      {data.products.slice(0, 100).map((p: any) => (
                        <tr key={p.id}>
                          <td><div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.reference}</p></div></td>
                          <td className="text-xs text-muted-foreground">{p.category?.name}</td>
                          <td className={cn('font-mono font-bold', p.currentStock <= p.minStock ? 'text-warning' : 'text-foreground')}>{p.currentStock}</td>
                          <td className="text-xs text-muted-foreground">{p.minStock}</td>
                          <td className="font-mono text-sm">{formatCurrency(p.buyPrice)}</td>
                          <td className="font-mono text-sm">{formatCurrency(p.sellPrice)}</td>
                          <td className="font-mono text-sm">{formatCurrency(p.currentStock * p.buyPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  )
}
