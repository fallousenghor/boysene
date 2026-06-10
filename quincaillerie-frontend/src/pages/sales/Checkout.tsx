import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ShoppingCart, Check, Package, CreditCard, Banknote } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/store/ui.store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, FormField, Separator } from '@/components/ui/index'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'

interface CartItem {
  productId: string
  name: string
  unitPrice: number
  quantity: number
  discount: number
  stock: number
}

const PAYMENT_METHODS = ['CASH', 'WAVE', 'ORANGE_MONEY', 'BANK_CARD', 'CREDIT']
const PAYMENT_LABELS: Record<string, string> = { CASH: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', BANK_CARD: 'Carte', CREDIT: 'Crédit' }

export default function Checkout({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [discount, setDiscount] = useState(0)
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { data: productsData, refetch: searchProducts } = useQuery({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      const r = await api.get('/products', { params: { search: productSearch || undefined, limit: 50, status: 'ACTIVE' } })
      return r.data
    },
    enabled: productSearch.length > 0,
  })

  const products = productsData?.data || []

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discount / 100), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount - discount

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/sales/quick', data),
    onSuccess: () => {
      toast.success('Vente enregistrée !')
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  const addItem = (p: any) => {
    const exists = cart.find(i => i.productId === p.id)
    if (exists) {
      setCart(cart.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setCart([...cart, { productId: p.id, name: p.name, unitPrice: p.sellPrice, quantity: 1, discount: 0, stock: p.currentStock }])
    }
    setProductSearch('')
  }

  const updateQty = (idx: number, qty: number) => {
    const newCart = cart.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, Math.min(qty, it.stock)) } : it)
    setCart(newCart)
  }

  const removeItem = (idx: number) => setCart(cart.filter((_, i) => i !== idx))

  const handleSubmit = () => {
    if (cart.length === 0) return
    mutation.mutate({
      items: cart.map(i => ({ productRef: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount })),
      paymentMethod,
      discount,
      taxRate,
      notes: notes || undefined,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Checkout rapide
          </DialogTitle>
          <DialogDescription>Vente express : recherche produit, ajout rapide, paiement en un clic</DialogDescription>
        </DialogHeader>

        <div className="flex gap-5 p-6 max-h-[70vh] overflow-hidden">
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Scanner code-barres ou chercher produit..."
                className="w-full h-10 pl-10 pr-3 rounded-lg bg-secondary border border-border focus:outline-none focus:border-primary/60"
              />
              {products.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {products.map((p: any) => (
                    <button key={p.id} onClick={() => addItem(p)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-secondary text-left">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Stock: {p.currentStock}</p>
                      </div>
                      <span className="text-sm font-mono">{formatCurrency(p.sellPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                  <Package className="h-8 w-8 opacity-30" />
                  <p>Cherchez et ajoutez des produits</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} FCFA</p>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => updateQty(idx, +e.target.value)}
                      className="w-16 h-8 text-center rounded bg-input border border-border text-sm font-mono"
                    />
                    <span className="text-sm font-mono w-24 text-right">
                      {formatCurrency(item.quantity * item.unitPrice * (1 - item.discount / 100))}
                    </span>
                    <button onClick={() => removeItem(idx)} className="text-xs text-destructive ml-1">✕</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-72 flex flex-col gap-4">
            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Sous-total</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
              {taxRate > 0 && <div className="flex justify-between"><span>TVA ({taxRate}%)</span><span className="font-mono">{formatCurrency(taxAmount)}</span></div>}
              {discount > 0 && <div className="flex justify-between"><span>Remise</span><span className="font-mono text-success">-{formatCurrency(discount)}</span></div>}
              <div className="flex justify-between py-2 border-t border-border">
                <span className="font-semibold">TOTAL</span>
                <span className="font-mono font-bold text-lg">{formatCurrency(total)}</span>
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

            <FormField label="Remise (FCFA)">
              <input type="number" min="0" value={discount} onChange={(e) => setDiscount(+e.target.value)} className="w-full h-8 px-2 rounded bg-input border border-border text-sm" />
            </FormField>

            <FormField label="TVA (%)">
              <input type="number" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(+e.target.value)} className="w-full h-8 px-2 rounded bg-input border border-border text-sm" />
            </FormField>

            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." className="w-full h-8 px-2 rounded bg-input border border-border text-sm" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} loading={mutation.isPending} disabled={cart.length === 0}>
            <CreditCard className="h-4 w-4" /> Payer {formatCurrency(total)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}