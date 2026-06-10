import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { api, extractData } from '@/lib/api'
import { formatCurrency, formatDate, statusConfig } from '@/lib/utils'
import { StatCard } from '@/components/charts/StatCard'
import { Card, CardHeader, CardTitle, CardContent, Badge, Spinner } from '@/components/ui/index'
import {
  TrendingUp, ShoppingCart, Receipt, Users, Package,
  AlertTriangle, Clock, DollarSign, ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['hsl(211,100%,55%)', 'hsl(173,80%,44%)', 'hsl(38,92%,55%)', 'hsl(0,72%,55%)', 'hsl(280,68%,60%)']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs">
      <p className="text-muted-foreground mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>
          {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard')
      return extractData<any>(res)
    },
  })

  const stats = data?.stats || {}
  const salesChart = data?.salesChart || []
  const topProducts = data?.topProducts || []
  const topCustomers = data?.topCustomers || []
  const lowStock = data?.lowStock || []
  const activity = data?.activity || {}

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Chiffre d'affaires" value={stats.revenue || 0} isCurrency
          icon={<DollarSign className="h-5 w-5" />} colorClass="text-primary" loading={isLoading} />
        <StatCard title="Bénéfice brut" value={stats.profit || 0} isCurrency
          icon={<TrendingUp className="h-5 w-5" />} colorClass="text-success" loading={isLoading} />
        <StatCard title="Achats" value={stats.purchases || 0} isCurrency
          icon={<ShoppingCart className="h-5 w-5" />} colorClass="text-warning" loading={isLoading} />
        <StatCard title="Ventes" value={stats.salesCount || 0}
          subtitle={`${stats.pendingSalesCount || 0} en attente`}
          icon={<Receipt className="h-5 w-5" />} colorClass="text-accent" loading={isLoading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Clients actifs" value={stats.customersCount || 0}
          icon={<Users className="h-5 w-5" />} colorClass="text-blue-400" loading={isLoading} />
        <StatCard title="Fournisseurs" value={stats.suppliersCount || 0}
          icon={<Users className="h-5 w-5" />} colorClass="text-purple-400" loading={isLoading} />
        <StatCard title="Produits" value={stats.productsCount || 0}
          icon={<Package className="h-5 w-5" />} colorClass="text-primary" loading={isLoading} />
        <StatCard title="Stock faible" value={stats.lowStockCount || 0}
          subtitle="produits en alerte"
          icon={<AlertTriangle className="h-5 w-5" />} colorClass="text-destructive" loading={isLoading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Évolution des ventes</CardTitle>
            <span className="text-xs text-muted-foreground">30 derniers jours</span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-52 flex items-center justify-center"><Spinner className="h-6 w-6" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={salesChart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215,12%,50%)' }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215,12%,50%)' }} tickFormatter={(v) => (v/1000).toFixed(0) + 'k'} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS[0]} strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Alertes stock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-48 flex items-center justify-center"><Spinner className="h-5 w-5" /></div>
            ) : lowStock.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">Aucune alerte</div>
            ) : (
              <div className="divide-y divide-border max-h-52 overflow-y-auto scrollbar-none">
                {lowStock.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.category?.name}</p>
                    </div>
                    <div className={cn('text-xs font-bold font-mono px-2 py-0.5 rounded',
                      p.currentStock === 0 ? 'text-destructive bg-destructive/10' : 'text-warning bg-warning/10'
                    )}>
                      {p.currentStock}/{p.minStock}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Top produits vendus</CardTitle>
            <span className="text-xs text-muted-foreground">Ce mois</span>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center"><Spinner /></div>
            ) : topProducts.length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <div className="divide-y divide-border">
                {topProducts.slice(0, 5).map((p: any, i: number) => (
                  <div key={p.id || i} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{Number(p.total_sold)} vendus</p>
                    </div>
                    <p className="text-xs font-mono font-semibold text-foreground shrink-0">{formatCurrency(Number(p.total_revenue))}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent sales */}
        <Card>
          <CardHeader>
            <CardTitle>Ventes récentes</CardTitle>
            <span className="text-xs text-muted-foreground">Dernières transactions</span>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="h-40 flex items-center justify-center"><Spinner /></div>
            ) : (activity.recentSales || []).length === 0 ? (
              <div className="p-5 text-center text-sm text-muted-foreground">Aucune vente</div>
            ) : (
              <div className="divide-y divide-border">
                {(activity.recentSales || []).slice(0, 5).map((s: any) => {
                  const sc = statusConfig[s.status] || statusConfig['PENDING']
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground">{s.customer?.name || 'Client comptant'}</p>
                        <p className="text-[10px] text-muted-foreground">{s.reference}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-semibold text-foreground">{formatCurrency(s.total)}</p>
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', sc.class)}>{sc.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
