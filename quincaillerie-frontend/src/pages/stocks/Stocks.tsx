import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Warehouse, AlertTriangle, TrendingUp, TrendingDown, Plus, ArrowUpDown } from 'lucide-react'
import { api, extractData, extractList, extractMeta } from '@/lib/api'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, Spinner, EmptyState, Input, FormField } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { toast } from '@/store/ui.store'
import { StatCard } from '@/components/charts/StatCard'

const MOVEMENT_TYPES = ['PURCHASE','SALE','RETURN_IN','RETURN_OUT','ADJUSTMENT','DAMAGE','TRANSFER']
const MOVEMENT_LABELS: Record<string, string> = { PURCHASE:'Achat', SALE:'Vente', RETURN_IN:'Retour entrant', RETURN_OUT:'Retour sortant', ADJUSTMENT:'Ajustement', DAMAGE:'Casse', TRANSFER:'Transfert' }
const MOVEMENT_COLORS: Record<string, string> = { PURCHASE:'text-success', SALE:'text-destructive', RETURN_IN:'text-success', RETURN_OUT:'text-destructive', ADJUSTMENT:'text-primary', DAMAGE:'text-warning', TRANSFER:'text-muted-foreground' }

function MovementForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [productSearch, setProductSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [movType, setMovType] = useState('PURCHASE')

  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const { data: products = [] } = useQuery({ queryKey: ['products-mov', productSearch], queryFn: async () => { const r = await api.get('/products', { params: { search: productSearch || undefined, limit: 10 } }); return extractList<any>(r) }, enabled: productSearch.length > 0 })

  const mutation = useMutation({
    mutationFn: (d: any) => api.post('/stocks/movement', d),
    onSuccess: () => { toast.success('Mouvement enregistré'); qc.invalidateQueries({ queryKey: ['stock-movements'] }); qc.invalidateQueries({ queryKey: ['stock-inventory'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouveau mouvement de stock</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => { if (!selectedProduct) return toast.error('Sélectionnez un produit'); mutation.mutate({ ...d, productId: selectedProduct.id, type: movType }) })}>
          <div className="p-6 space-y-4">
            <FormField label="Produit" required>
              {selectedProduct ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
                  <div><p className="text-sm font-medium">{selectedProduct.name}</p><p className="text-xs text-muted-foreground">Stock: {selectedProduct.currentStock}</p></div>
                  <button type="button" onClick={() => setSelectedProduct(null)} className="text-xs text-destructive hover:underline">Changer</button>
                </div>
              ) : (
                <div className="relative">
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Rechercher un produit..."
                    className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
                  {products.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto">
                      {products.map((p: any) => (
                        <button key={p.id} type="button" onClick={() => { setSelectedProduct(p); setProductSearch('') }}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary text-left text-sm">
                          <span>{p.name}</span><span className="text-xs font-mono text-muted-foreground">Stock: {p.currentStock}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </FormField>
            <FormField label="Type de mouvement">
              <Select onValueChange={setMovType} defaultValue="PURCHASE">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MOVEMENT_TYPES.map(t => <SelectItem key={t} value={t}>{MOVEMENT_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Quantité" required><Input type="number" min="1" {...register('quantity')} placeholder="0" /></FormField>
            <FormField label="Coût unitaire (FCFA)"><Input type="number" min="0" {...register('unitCost')} placeholder="0" /></FormField>
            <FormField label="Motif"><Input {...register('reason')} placeholder="Raison du mouvement..." /></FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function Stocks() {
  const [page, setPage] = useState(1)
  const [showMovForm, setShowMovForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'inventory' | 'movements' | 'alerts'>('inventory')
  const [invPage, setInvPage] = useState(1)
  const [invSearch, setInvSearch] = useState('')
  const [invCategory, setInvCategory] = useState<string | undefined>(undefined)
  const [invBrand, setInvBrand] = useState<string | undefined>(undefined)
  const [invLowStock, setInvLowStock] = useState(false)

  const { data: categoriesRaw } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const r = await api.get('/categories');
      return extractList<any>(r)
    },
  })
  const { data: brandsRaw } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const r = await api.get('/brands');
      return extractList<any>(r)
    },
  })

  // Prevent runtime errors if backend envelope changes or react-query data isn't normalized.
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : []
  const brands = Array.isArray(brandsRaw) ? brandsRaw : []


  const categoryItems = categories
  const brandItems = brands


  const { data: inventory, isLoading: invLoading } = useQuery({
    queryKey: ['stock-inventory', invPage, invSearch, invCategory, invBrand, invLowStock],
    queryFn: async () => {
      const params: any = { page: invPage, limit: 20 }
      if (invSearch) params.search = invSearch
      if (invCategory) params.categoryId = invCategory
      if (invBrand) params.brandId = invBrand
      if (invLowStock) params.lowStock = true
      const r = await api.get('/stocks/inventory', { params })
      return extractData<any>(r)
    }
  })
  const { data: movements, isLoading: movLoading } = useQuery({ queryKey: ['stock-movements', page], queryFn: async () => {
    const r = await api.get('/stocks/movements', { params: { page, limit: 20 } })
    return { data: extractList<any>(r), meta: extractMeta(r) }
  } })
  const { data: alerts = [] } = useQuery({ queryKey: ['stock-alerts'], queryFn: async () => { const r = await api.get('/stocks/alerts'); return extractList<any>(r) } })

  const invProducts = inventory?.products || []
  const invMeta = inventory?.meta || {}
  const movData = movements?.data || []
  const movMeta = movements?.meta || {}
  const alertItems: any[] = alerts

  const tabs = [{ id: 'inventory', label: 'Inventaire' }, { id: 'movements', label: 'Mouvements' }, { id: 'alerts', label: `Alertes ${alertItems.length > 0 ? `(${alertItems.length})` : ''}` }]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Stocks</h2><p className="text-xs text-muted-foreground">Gestion des entrées, sorties et inventaire</p></div>
        <Button onClick={() => setShowMovForm(true)}><Plus className="h-4 w-4" /> Mouvement</Button>
      </div>

      {inventory?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Produits en stock" value={inventory.summary.totalProducts} icon={<Warehouse className="h-5 w-5" />} colorClass="text-primary" loading={invLoading} />
          <StatCard title="Valeur inventaire" value={inventory.summary.inventoryValue} isCurrency icon={<TrendingUp className="h-5 w-5" />} colorClass="text-success" loading={invLoading} />
          <StatCard title="Stock faible" value={inventory.summary.lowStockCount} icon={<AlertTriangle className="h-5 w-5" />} colorClass="text-warning" loading={invLoading} />
          <StatCard title="Rupture de stock" value={inventory.summary.outOfStockCount} icon={<TrendingDown className="h-5 w-5" />} colorClass="text-destructive" loading={invLoading} />
        </div>
      )}

      <Card>
        <div className="flex border-b border-border">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={cn('px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'inventory' && (
          invLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
            : (
              <div>
                <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
                  <div className="relative flex-1 max-w-xs">
                    <input value={invSearch} onChange={(e) => { setInvSearch(e.target.value); setInvPage(1) }} placeholder="Rechercher produit..."
                      className="w-full h-8 pl-3 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors" />
                  </div>
                  <Select
                    onValueChange={(v: string) => { setInvCategory(v === '__all__' ? undefined : v); setInvPage(1) }}
                    value={invCategory || '__all__'}
                  >

                    <SelectTrigger className="min-w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Toutes catégories</SelectItem>

                      {categoryItems.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    onValueChange={(v: string) => { setInvBrand(v === '__all__' ? undefined : v); setInvPage(1) }}
                    value={invBrand || '__all__'}
                  >

                    <SelectTrigger className="min-w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Toutes marques</SelectItem>

                      {brandItems.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant={invLowStock ? 'default' : 'outline'} size="sm" onClick={() => { setInvLowStock(v => !v); setInvPage(1) }}>{invLowStock ? 'Filtre: Faible' : 'Afficher Faible'}</Button>
                </div>

                {invProducts.length === 0 ? <EmptyState icon={<Warehouse className="h-6 w-6" />} title="Inventaire vide" />
                : (
                  <>
                    <Table>
                      <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Catégorie</TableHead><TableHead>Stock actuel</TableHead><TableHead>Stock min</TableHead><TableHead>Valeur</TableHead><TableHead>État</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {invProducts.map((p: any) => {
                          const isLow = p.currentStock <= p.minStock
                          const isOut = p.currentStock === 0
                          return (
                            <TableRow key={p.id}>
                              <TableCell><div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground font-mono">{p.reference}</p></div></TableCell>
                              <TableCell><span className="text-xs text-muted-foreground">{p.category?.name}</span></TableCell>
                              <TableCell><span className={cn('text-sm font-mono font-bold', isOut ? 'text-destructive' : isLow ? 'text-warning' : 'text-foreground')}>{p.currentStock} {p.unit}</span></TableCell>
                              <TableCell><span className="text-xs text-muted-foreground">{p.minStock}</span></TableCell>
                              <TableCell><span className="text-sm font-mono text-muted-foreground">{formatCurrency(p.currentStock * p.buyPrice)}</span></TableCell>
                              <TableCell>
                                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', isOut ? 'bg-destructive/10 text-destructive' : isLow ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success')}>
                                  {isOut ? 'Rupture' : isLow ? 'Faible' : 'OK'}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    <div className="px-5 py-3 border-t border-border flex items-center justify-end">
                      <Pagination page={invPage} totalPages={invMeta.pages || 1} total={invMeta.total || 0} limit={invMeta.limit || 20} onPageChange={setInvPage} />
                    </div>
                  </>
                )}
              </div>
            )
        )}

        {activeTab === 'movements' && (
          movLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
            : movData.length === 0 ? <EmptyState icon={<ArrowUpDown className="h-6 w-6" />} title="Aucun mouvement" />
            : (<>
              <Table>
                <TableHeader><TableRow><TableHead>Produit</TableHead><TableHead>Type</TableHead><TableHead>Quantité</TableHead><TableHead>Référence</TableHead><TableHead>Date</TableHead><TableHead>Par</TableHead></TableRow></TableHeader>
                <TableBody>
                  {movData.map((m: any) => {
                    const isIn = ['PURCHASE', 'RETURN_IN'].includes(m.type)
                    return (
                      <TableRow key={m.id}>
                        <TableCell><span className="text-sm font-medium">{m.product?.name}</span></TableCell>
                        <TableCell><span className={cn('text-xs font-medium', MOVEMENT_COLORS[m.type] || 'text-muted-foreground')}>{MOVEMENT_LABELS[m.type] || m.type}</span></TableCell>
                        <TableCell><span className={cn('text-sm font-mono font-bold', isIn ? 'text-success' : 'text-destructive')}>{isIn ? '+' : '-'}{m.quantity}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground font-mono">{m.reference || '—'}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{m.user?.firstName} {m.user?.lastName}</span></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <Pagination page={page} totalPages={movMeta.pages || 1} total={movMeta.total || 0} limit={20} onPageChange={setPage} />
            </>)
        )}

        {activeTab === 'alerts' && (
          alertItems.length === 0 ? <EmptyState icon={<AlertTriangle className="h-6 w-6" />} title="Aucune alerte" description="Tous vos stocks sont à niveau." />
            : (
              <div className="divide-y divide-border">
                {alertItems.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', p.currentStock === 0 ? 'bg-destructive/10' : 'bg-warning/10')}>
                      <AlertTriangle className={cn('h-5 w-5', p.currentStock === 0 ? 'text-destructive' : 'text-warning')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.category?.name} · Réf: {p.reference}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-lg font-mono font-bold', p.currentStock === 0 ? 'text-destructive' : 'text-warning')}>{p.currentStock}</p>
                      <p className="text-xs text-muted-foreground">/ {p.minStock} min</p>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}
      </Card>

      {showMovForm && <MovementForm onClose={() => setShowMovForm(false)} />}
    </div>
  )
}
