import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from '@/store/ui.store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/index'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'

const schema = z.object({
  name: z.string().min(2, 'Nom requis'),
  categoryId: z.string().min(1, 'Catégorie requise'),
  brandId: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().default('pcs'),
  buyPrice: z.coerce.number().min(0),
  sellPrice: z.coerce.number().min(0),
  minStock: z.coerce.number().min(0).default(5),
  currentStock: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
})

export default function ProductForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const isEdit = !!editing

  const { data: cats } = useQuery({ queryKey: ['categories-all'], queryFn: async () => { const r = await api.get('/categories'); return r.data } })
  const { data: brands } = useQuery({ queryKey: ['brands-all'], queryFn: async () => { const r = await api.get('/brands'); return r.data } })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  // Type helper: react-hook-form's `editing?.brandId` can sometimes be a FieldError during tooling inference.
  const editingBrandId = (editing as any)?.brandId as string | undefined

  useEffect(() => {
    if (editing) {
      Object.entries(editing).forEach(([k, v]) => setValue(k as any, v))
    } else {
      reset()
    }
  }, [editing])

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // Radix Select doesn't allow empty-string values.
      // Our "Aucune" option uses a sentinel value.
      const payload = {
        ...data,
        brandId: data.brandId === 'none' ? undefined : (data.brandId as string | undefined),
      }

      if (isEdit) return api.patch(`/products/${editing.id}`, payload)
      return api.post('/products', payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Produit modifié' : 'Produit créé')
      qc.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erreur'),
  })

  const categories = Array.isArray(cats) ? cats : (cats as any)?.data || []
  const brandsList = Array.isArray(brands) ? brands : (brands as any)?.data || []

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="p-6 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
            <div className="col-span-2">
              <FormField label="Nom du produit" error={errors.name?.message as string} required>
                <Input {...register('name')} placeholder="Ex: Tournevis cruciforme..." error={errors.name?.message as string} />
              </FormField>
            </div>
            <FormField label="Catégorie" error={errors.categoryId?.message as string} required>
              <Select onValueChange={(v) => setValue('categoryId', v)} defaultValue={editing?.categoryId}>
              <SelectTrigger error={errors.categoryId?.message ? String(errors.categoryId.message) : undefined}>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Marque">
              <Select
                onValueChange={(v) => setValue('brandId', v)}
                defaultValue={editingBrandId ?? 'none'}
              >
                  <SelectTrigger>
                    <SelectValue placeholder="Optionnel..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>

                  {brandsList.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Code-barres">
              <Input {...register('barcode')} placeholder="Ex: 6009871234..." />
            </FormField>
            <FormField label="Unité">
              <Select onValueChange={(v) => setValue('unit', v)} defaultValue={editing?.unit || 'pcs'}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['pcs', 'kg', 'L', 'm', 'm²', 'boite', 'sachet', 'rouleau'].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Prix d'achat (FCFA)" error={errors.buyPrice?.message as string} required>
              <Input type="number" {...register('buyPrice')} placeholder="0" error={errors.buyPrice?.message as string} />
            </FormField>
            <FormField label="Prix de vente (FCFA)" error={errors.sellPrice?.message as string} required>
              <Input type="number" {...register('sellPrice')} placeholder="0" error={errors.sellPrice?.message as string} />
            </FormField>
            <FormField label="Stock initial">
              <Input type="number" {...register('currentStock')} placeholder="0" />
            </FormField>
            <FormField label="Stock minimum (alerte)">
              <Input type="number" {...register('minStock')} placeholder="5" />
            </FormField>
            <div className="col-span-2">
              <FormField label="Description">
                <Input {...register('description')} placeholder="Description optionnelle..." />
              </FormField>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>{isEdit ? 'Enregistrer' : 'Créer'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
