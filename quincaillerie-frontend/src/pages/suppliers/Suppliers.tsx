import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Truck, MoreHorizontal, Edit, Trash2, Phone, MessageCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, EmptyState, Badge, Input, FormField } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { toast } from '@/store/ui.store'

function SupplierForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: editing || {} })
  const mutation = useMutation({
    mutationFn: (d: any) => editing ? api.patch(`/suppliers/${editing.id}`, d) : api.post('/suppliers', d),
    onSuccess: () => { toast.success(editing ? 'Fournisseur modifié' : 'Fournisseur créé'); qc.invalidateQueries({ queryKey: ['suppliers'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifier fournisseur' : 'Nouveau fournisseur'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="col-span-2"><FormField label="Nom" required><Input {...register('name')} placeholder="Nom du fournisseur" /></FormField></div>
            <FormField label="Téléphone"><Input {...register('phone')} placeholder="+221 77..." /></FormField>
            <FormField label="WhatsApp"><Input {...register('whatsapp')} placeholder="+221 77..." /></FormField>
            <FormField label="Email"><Input type="email" {...register('email')} /></FormField>
            <FormField label="Ville"><Input {...register('city')} placeholder="Dakar" /></FormField>
            <div className="col-span-2"><FormField label="Adresse"><Input {...register('address')} /></FormField></div>
            <div className="col-span-2"><FormField label="Notes"><Input {...register('notes')} /></FormField></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function Suppliers() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<any>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: async () => { const r = await api.get('/suppliers', { params: { page, limit: 15, search: search || undefined } }); return r.data },
  })

  const delMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => { toast.success('Fournisseur supprimé'); qc.invalidateQueries({ queryKey: ['suppliers'] }) },
  })

  const items = data?.data || []; const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Fournisseurs</h2><p className="text-xs text-muted-foreground">{meta.total || 0} fournisseurs</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nouveau fournisseur</Button>
      </div>
      <Card>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Nom, code..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
          </div>
        </div>
        {isLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? <EmptyState icon={<Truck className="h-6 w-6" />} title="Aucun fournisseur"
            action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Ajouter</Button>} />
          : (<>
            <Table>
              <TableHeader><TableRow><TableHead>Fournisseur</TableHead><TableHead>Contact</TableHead><TableHead>Ville</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{s.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        {s.phone && <span className="text-xs flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{s.phone}</span>}
                        {s.whatsapp && <span className="text-xs flex items-center gap-1 text-success"><MessageCircle className="h-3 w-3" />{s.whatsapp}</span>}
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{s.city || '—'}</span></TableCell>
                    <TableCell><Badge variant={s.isActive ? 'success' : 'error'}>{s.isActive ? 'Actif' : 'Inactif'}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(s); setShowForm(true) }}><Edit className="h-4 w-4" /> Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onClick={() => delMutation.mutate(s.id)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={meta.pages || 1} total={meta.total || 0} limit={15} onPageChange={setPage} />
          </>)}
      </Card>
      {showForm && <SupplierForm editing={editing} onClose={() => { setEditing(null); setShowForm(false) }} />}
    </div>
  )
}
