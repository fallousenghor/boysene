import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Search, Package, ShoppingCart } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/store/ui.store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, FormField, Separator } from '@/components/ui/index'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'

interface LineItem { productId: string; name: string; unitPrice: number; quantity: number; discount: number; stock: number; unit: string }

const PAYMENT_METHODS = ['CASH', 'WAVE', 'ORANGE_MONEY', 'BANK_CARD', 'CREDIT']
const PAYMENT_LABELS: Record<string, string> = { CASH: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', BANK_CARD: 'Carte bancaire', CREDIT: 'Crédit' }

export default function SaleForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [items, setItems] = useState<LineItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [amountPaid, setAmountPaid] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [productSearch, setProductSearch] = useState('')

  const { data: productsData } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => { const r = await api.get('/products', { params: { search: productSearch || undefined, limit: 50, status: 'ACTIVE' } }); return r.data },
  })
  const { data: customersData } = useQuery({
    queryKey: ['customers-all'],
    queryFn: async () => { const r = await api.get('/customers', { params: { limit: 100 } }); return r.data },
  })

  const products = productsData?.data || []
  const customers = customersData?.data || []

  const addProduct = (p: any) => {
    const exists = items.find(i => i.productId === p.id)
    if (exists) {
      setItems(items.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setItems([...items, { productId: p.id, name: p.name, unitPrice: p.sellPrice, quantity: 1, discount: 0, stock: p.currentStock, unit: p.unit || 'pcs' }])
    }
    setProductSearch('')
  }

  const updateItem = (idx: number, field: keyof LineItem, value: any) => {
    setItems(items.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discount / 100), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount - discount
  const change = amountPaid - total

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/sales', data),
    onSuccess: () => {
      toast.success('Vente créée avec succès !')
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création'),
  })

  const handleSubmit = () => {
    if (items.length === 0) return toast.error('Ajoutez au moins un produit')
    if (total <= 0) return toast.error('Total invalide')
    if (!paymentMethod || !PAYMENT_METHODS.includes(paymentMethod)) {
      toast.error('Mode de paiement invalide')
      return
    }
    mutation.mutate({
      customerId: customerId === 'comptant' ? undefined : customerId,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      discount, taxRate, amountPaid, paymentMethod, notes,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Nouvelle vente</DialogTitle>
          <DialogDescription>Créez une nouvelle vente en sélectionnant des produits et un client</DialogDescription>
        </DialogHeader>

        <div className="flex gap-5 p-6 max-h-[70vh] overflow-hidden">
          {/* Left — Product selector & items */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Chercher un produit ou cliquer ci-dessous..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
              {products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                  {products.map((p: any) => (
                    <button key={p.id} onClick={() => addProduct(p)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary text-left transition-colors">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Stock: {p.currentStock} {p.unit}</p>
                      </div>
                      <span className="text-sm font-mono font-semibold text-foreground ml-4">{formatCurrency(p.sellPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                  <Package className="h-8 w-8 opacity-30" />
                  <p>Recherchez et ajoutez des produits</p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} × unité</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input type="number" min="1" max={item.stock} value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', +e.target.value)}
                        className="w-16 h-7 text-center rounded-md bg-input border border-border text-sm font-mono focus:outline-none focus:border-primary/60" />
                      <input type="number" min="0" max="100" value={item.discount}
                        onChange={(e) => updateItem(idx, 'discount', +e.target.value)}
                        placeholder="0%"
                        className="w-14 h-7 text-center rounded-md bg-input border border-border text-xs focus:outline-none focus:border-primary/60" />
                      <span className="text-sm font-mono font-bold text-foreground w-24 text-right">
                        {formatCurrency(item.quantity * item.unitPrice * (1 - item.discount / 100))}
                      </span>
                      <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right — Customer, totals, payment */}
          <div className="w-72 flex flex-col gap-4 shrink-0">
            <FormField label="Client">
              <Select onValueChange={setCustomerId} defaultValue="comptant">
                <SelectTrigger><SelectValue placeholder="Client comptant" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comptant">Client comptant</SelectItem>
                  {customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Remise (FCFA)">
                <input type="number" min="0" value={discount} onChange={(e) => setDiscount(+e.target.value)}
                  disabled={items.length === 0}
                  className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed" />
              </FormField>
              <FormField label="TVA (%)">
                <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(+e.target.value)}
                  disabled={items.length === 0}
                  className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary/60 disabled:opacity-50 disabled:cursor-not-allowed" />
              </FormField>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
              {taxRate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">TVA ({taxRate}%)</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>}
              {discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Remise</span><span className="font-mono text-success">-{formatCurrency(discount)}</span></div>}
              <div className="flex justify-between py-2 border-t border-border">
                <span className="font-semibold text-foreground">TOTAL</span>
                <span className="font-mono font-bold text-lg text-foreground">{formatCurrency(total)}</span>
              </div>
            </div>

            <FormField label="Mode de paiement">
              <Select onValueChange={setPaymentMethod} defaultValue="CASH">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{PAYMENT_LABELS[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Montant encaissé (FCFA)">
              <input type="number" min="0" value={amountPaid} onChange={(e) => setAmountPaid(+e.target.value)}
                disabled={items.length === 0 || total <= 0}
                className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm focus:outline-none focus:border-primary/60 font-mono disabled:opacity-50 disabled:cursor-not-allowed" />
            </FormField>

            {amountPaid > 0 && change >= 0 && (
              <div className="flex justify-between text-sm p-2.5 rounded-lg bg-success/10 border border-success/20">
                <span className="text-success font-medium">Rendu monnaie</span>
                <span className="font-mono font-bold text-success">{formatCurrency(change)}</span>
              </div>
            )}
            {amountPaid > 0 && change < 0 && (
              <div className="flex justify-between text-sm p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                <span className="text-warning font-medium">Reste à payer</span>
                <span className="font-mono font-bold text-warning">{formatCurrency(-change)}</span>
              </div>
            )}

            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              className="w-full h-9 px-3 rounded-lg bg-input border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending} disabled={items.length === 0 || total <= 0}>
            <ShoppingCart className="h-4 w-4" /> Valider la vente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
