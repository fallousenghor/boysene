import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Tags, Edit, Trash2, Package } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, EmptyState, Badge, Input, FormField } from '@/components/ui/index'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { toast } from '@/store/ui.store'

function CategoryForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: editing || {} })
  const mutation = useMutation({
    mutationFn: (d: any) => editing ? api.patch(`/categories/${editing.id}`, d) : api.post('/categories', d),
    onSuccess: () => { toast.success(editing ? 'Catégorie modifiée' : 'Catégorie créée'); qc.invalidateQueries({ queryKey: ['categories'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvelle catégorie'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="p-6 space-y-4">
            <FormField label="Nom" required><Input {...register('name')} placeholder="Ex: Électricité" /></FormField>
            <FormField label="Description"><Input {...register('description')} placeholder="Description optionnelle" /></FormField>
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

export function Categories() {
  const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<any>(null)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: async () => { const r = await api.get('/categories'); return r.data } })
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/categories/${id}`), onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries({ queryKey: ['categories'] }) }, onError: () => toast.error('Impossible de supprimer') })
  const items = Array.isArray(data) ? data : data?.data || []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Catégories</h2><p className="text-xs text-muted-foreground">{items.length} catégories</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nouvelle catégorie</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? <div className="col-span-full h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? (
            <div className="col-span-full">
              <EmptyState icon={<Tags className="h-6 w-6" />} title="Aucune catégorie" action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Ajouter</Button>} />
            </div>
          ) : items.map((c: any) => (
            <Card key={c.id} className="group hover:border-border/80 transition-colors">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tags className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(c); setShowForm(true) }}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <p className="font-semibold text-foreground">{c.name}</p>
                {c.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                <div className="flex items-center gap-1 mt-3">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{c._count?.products || 0} produits</span>
                </div>
              </div>
            </Card>
          ))}
      </div>
      {showForm && <CategoryForm editing={editing} onClose={() => { setEditing(null); setShowForm(false) }} />}
    </div>
  )
}

export default Categories
