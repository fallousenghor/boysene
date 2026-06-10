import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Filter, Edit, Trash2, Package, MoreHorizontal, Barcode, Tag } from 'lucide-react'
import { api } from '@/lib/api'
import { formatCurrency, statusConfig, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Badge, Card, Spinner, EmptyState } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { toast } from '@/store/ui.store'
import ProductForm from './ProductForm'

export default function Products() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: async () => {
      const res = await api.get('/products', { params: { page, limit: 15, search: search || undefined } })
      // API returns {success, data: {data: [...], meta: {...}}}
      // After api interceptor unwraps: {data: [...], meta: {...}}
      return res.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Produit supprimé'); qc.invalidateQueries({ queryKey: ['products'] }) },
    onError: () => toast.error('Impossible de supprimer ce produit'),
  })

  const products = data?.data || []
  const meta = data?.meta || {}

  const handleEdit = (p: any) => { setEditing(p); setShowForm(true) }
  const handleClose = () => { setEditing(null); setShowForm(false) }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Produits</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{meta.total || 0} produits au total</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Nouveau produit
        </Button>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Rechercher produits..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>
          <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5" /> Filtres</Button>
          <input id="import-json" type="file" accept="application/json" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const data = JSON.parse(text);

              // fetch existing categories and brands
              const [catsRes, brandsRes] = await Promise.all([api.get('/categories'), api.get('/brands')]);
              const cats: any[] = catsRes.data.data || catsRes.data || [];
              const brands: any[] = brandsRes.data.data || brandsRes.data || [];
              const catMap: Record<string,string> = {};
              const brandMap: Record<string,string> = {};
              cats.forEach(c => catMap[c.name] = c.id);
              brands.forEach(b => brandMap[b.name] = b.id);

              // create missing categories
              const fileCats = Array.isArray(data.categories) ? data.categories : [];
              for (const cname of fileCats) {
                if (!catMap[cname]) {
                  const res = await api.post('/categories', { name: cname });
                  const c = res.data;
                  catMap[c.name] = c.id || c.data?.id;
                }
              }

              // create missing brands
              const fileBrands = Array.isArray(data.brands) ? data.brands : [];
              for (const bname of fileBrands) {
                if (!brandMap[bname]) {
                  const res = await api.post('/brands', { name: bname });
                  const b = res.data;
                  brandMap[b.name] = b.id || b.data?.id;
                }
              }

              // create products
              const fileProducts = Array.isArray(data.products) ? data.products : [];
              let created = 0;
              for (const p of fileProducts) {
                try {
                  const payload: any = {
                    name: p.name,
                    description: p.description || undefined,
                    categoryId: catMap[p.category],
                    brandId: p.brand ? brandMap[p.brand] : undefined,
                    unit: p.unit || 'pcs',
                    buyPrice: p.buyPrice || 0,
                    sellPrice: p.sellPrice || 0,
                    minStock: p.minStock ?? 5,
                    currentStock: p.currentStock ?? 0,
                  };
                  await api.post('/products', payload);
                  created++;
                } catch (err) {
                  // continue on error
                }
              }

              toast.success(`${created} produits importés`);
              qc.invalidateQueries({ queryKey: ['products'] });
            } catch (err) {
              toast.error('Import JSON invalide');
            } finally {
              (e.target as HTMLInputElement).value = '';
            }
          }} />
          <Button variant="ghost" size="sm" onClick={() => document.getElementById('import-json')?.click()}><Package className="h-3.5 w-3.5" /> Importer JSON</Button>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center"><Spinner className="h-6 w-6" /></div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="Aucun produit"
            description="Commencez par ajouter votre premier produit."
            action={<Button onClick={() => setShowForm(true)} size="sm"><Plus className="h-4 w-4" /> Ajouter</Button>}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>P. Achat</TableHead>
                  <TableHead>P. Vente</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p: any) => {
                  const sc = statusConfig[p.status] || {}
                  const isLow = p.currentStock <= p.minStock
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">{p.name}</p>
                            {p.barcode && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Barcode className="h-3 w-3" />{p.barcode}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">{p.reference}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{p.category?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-muted-foreground">{formatCurrency(p.buyPrice)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono font-semibold text-foreground">{formatCurrency(p.sellPrice)}</span>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          'inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-1 rounded-lg',
                          isLow ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                        )}>
                          {isLow && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                          {p.currentStock} {p.unit}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', sc.class)}>{sc.label}</span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(p)}>
                              <Edit className="h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => deleteMutation.mutate(p.id)}>
                              <Trash2 className="h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
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

      {showForm && <ProductForm editing={editing} onClose={handleClose} />}
    </div>
  )
}
