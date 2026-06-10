import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ShoppingCart, MoreHorizontal, Eye, CheckCircle, PackageCheck, XCircle, Download, MessageCircle, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, statusConfig, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, EmptyState, Input, FormField, Separator } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { toast } from '@/store/ui.store'

interface LineItem { productId: string; name: string; unitPrice: number; quantity: number; stock: number; unit: string }

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [items, setItems] = useState<LineItem[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [productSearch, setProductSearch] = useState('')

  const { data: suppliersData } = useQuery({ queryKey: ['suppliers-all'], queryFn: async () => { const r = await api.get('/suppliers', { params: { limit: 100 } }); return r.data } })
  const { data: productsData } = useQuery({ queryKey: ['products-search-pur', productSearch], queryFn: async () => { const r = await api.get('/products', { params: { search: productSearch || undefined, limit: 20 } }); return r.data }, enabled: productSearch.length > 0 })

  const suppliers = suppliersData?.data || []
  const products = productsData?.data || []

  const addProduct = (p: any) => {
    const exists = items.find(i => i.productId === p.id)
    if (exists) { setItems(items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i)) }
    else { setItems([...items, { productId: p.id, name: p.name, unitPrice: p.buyPrice, quantity: 1, stock: p.currentStock, unit: p.unit || 'pcs' }]) }
    setProductSearch('')
  }

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount - discount

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/purchases', data),
    onSuccess: () => { toast.success('Commande créée !'); qc.invalidateQueries({ queryKey: ['purchases'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="xl">
        <DialogHeader><DialogTitle>Nouvelle commande fournisseur</DialogTitle></DialogHeader>
        <div className="flex gap-5 p-6 max-h-[70vh] overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Rechercher un produit..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
              {products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {products.map((p: any) => (
                    <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary text-left transition-colors">
                      <div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">Stock actuel: {p.currentStock}</p></div>
                      <span className="text-sm font-mono font-semibold ml-4">{formatCurrency(p.buyPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                  <ShoppingCart className="h-8 w-8 opacity-30" /><p>Ajoutez des produits à commander</p>
                </div>
              ) : items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.name}</p></div>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => setItems(items.map((it, i) => i === idx ? { ...it, quantity: +e.target.value } : it))}
                    className="w-16 h-7 text-center rounded-md bg-input border border-border text-sm font-mono focus:outline-none" />
                  <input type="number" min="0" value={item.unitPrice} onChange={(e) => setItems(items.map((it, i) => i === idx ? { ...it, unitPrice: +e.target.value } : it))}
                    className="w-24 h-7 px-2 rounded-md bg-input border border-border text-sm font-mono focus:outline-none" />
                  <span className="text-sm font-mono font-bold w-24 text-right">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="w-64 flex flex-col gap-4 shrink-0">
            <FormField label="Fournisseur" required>
              <Select onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-2">
              <FormField label="Remise"><input type="number" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none" /></FormField>
              <FormField label="TVA %"><input type="number" value={taxRate} onChange={(e) => setTaxRate(+e.target.value)} className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none" /></FormField>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
              {taxRate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">TVA</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>}
              <div className="flex justify-between font-bold border-t border-border pt-2"><span>TOTAL</span><span className="font-mono text-lg">{formatCurrency(total)}</span></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => { if (!supplierId) return toast.error('Sélectionnez un fournisseur'); if (items.length === 0) return toast.error('Ajoutez des produits'); mutation.mutate({ supplierId, items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })), taxRate, discount }) }}
            loading={mutation.isPending} disabled={items.length === 0}>
            <ShoppingCart className="h-4 w-4" /> Créer la commande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Purchases() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page],
    queryFn: async () => { const r = await api.get('/purchases', { params: { page, limit: 15 } }); return r.data },
  })

  const confirm = useMutation({ mutationFn: (id: string) => api.post(`/purchases/${id}/confirm`), onSuccess: () => { toast.success('Commande confirmée'); qc.invalidateQueries({ queryKey: ['purchases'] }) }, onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur') })
  const cancel = useMutation({ mutationFn: (id: string) => api.post(`/purchases/${id}/cancel`), onSuccess: () => { toast.success('Commande annulée'); qc.invalidateQueries({ queryKey: ['purchases'] }) } })

  const downloadPdf = async (id: string) => {
    try {
      const res = await api.get(`/invoices/purchase/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `bon-commande-${id}.pdf`; a.click(); URL.revokeObjectURL(url)
    } catch { toast.error('Erreur PDF') }
  }

  const sendWA = async (id: string) => { try { await api.post(`/whatsapp/purchase/${id}`); toast.success('Bon commande envoyé !') } catch { toast.error('Erreur WhatsApp') } }

  const items = data?.data || []; const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Achats</h2><p className="text-xs text-muted-foreground">{meta.total || 0} commandes</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nouvelle commande</Button>
      </div>
      <Card>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Référence, fournisseur..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
          </div>
        </div>
        {isLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? <EmptyState icon={<ShoppingCart className="h-6 w-6" />} title="Aucune commande" action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Créer</Button>} />
          : (<>
            <Table>
              <TableHeader><TableRow><TableHead>Référence</TableHead><TableHead>Fournisseur</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((p: any) => {
                  const sc = statusConfig[p.status] || {}
                  return (
                    <TableRow key={p.id}>
                      <TableCell><span className="font-mono text-xs text-warning font-semibold">{p.reference}</span></TableCell>
                      <TableCell><span className="text-sm font-medium">{p.supplier?.name}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</span></TableCell>
                      <TableCell><span className="text-sm font-mono font-bold">{formatCurrency(p.total)}</span></TableCell>
                      <TableCell><span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', sc.class)}>{sc.label}</span></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {p.status === 'DRAFT' && <DropdownMenuItem onClick={() => confirm.mutate(p.id)}><CheckCircle className="h-4 w-4" /> Confirmer</DropdownMenuItem>}
                            {p.status === 'ORDERED' && <DropdownMenuItem onClick={() => toast.info('Ouvrez les détails pour réceptionner')}><PackageCheck className="h-4 w-4" /> Réceptionner</DropdownMenuItem>}
                            <DropdownMenuItem onClick={() => downloadPdf(p.id)}><Download className="h-4 w-4" /> PDF</DropdownMenuItem>
                            {p.supplier?.whatsapp && <DropdownMenuItem onClick={() => sendWA(p.id)}><MessageCircle className="h-4 w-4" /> WhatsApp</DropdownMenuItem>}
                            {!['RECEIVED', 'CANCELLED'].includes(p.status) && (
                              <><DropdownMenuSeparator /><DropdownMenuItem destructive onClick={() => cancel.mutate(p.id)}><XCircle className="h-4 w-4" /> Annuler</DropdownMenuItem></>
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
          </>)}
      </Card>
      {showForm && <PurchaseForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
