import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, MoreHorizontal, Edit, Trash2, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, EmptyState, Badge, Input, FormField } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { toast } from '@/store/ui.store'

function UserForm({ editing, onClose }: { editing?: any; onClose: () => void }) {
  const qc = useQueryClient()
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useForm({ defaultValues: editing || {} })
  const { data: rolesData } = useQuery({ queryKey: ['roles'], queryFn: async () => { const r = await api.get('/roles'); return r.data } })
  const roles = Array.isArray(rolesData) ? rolesData : rolesData?.data || []
  const mutation = useMutation({
    mutationFn: (d: any) => editing ? api.patch(`/users/${editing.id}`, d) : api.post('/users', d),
    onSuccess: () => { toast.success(editing ? 'Utilisateur modifié' : 'Utilisateur créé'); qc.invalidateQueries({ queryKey: ['users'] }); onClose() },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur'),
  })
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? 'Modifier utilisateur' : 'Nouvel utilisateur'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <div className="p-6 grid grid-cols-2 gap-4">
            <FormField label="Prénom" required><Input {...register('firstName')} /></FormField>
            <FormField label="Nom" required><Input {...register('lastName')} /></FormField>
            <div className="col-span-2"><FormField label="Email" required><Input type="email" {...register('email')} /></FormField></div>
            {!editing && <div className="col-span-2"><FormField label="Mot de passe" required><Input type="password" {...register('password')} placeholder="Min 8 caractères" /></FormField></div>}
            <FormField label="Téléphone"><Input {...register('phone')} /></FormField>
            <FormField label="Rôle" required>
              <Select onValueChange={(v) => setValue('roleId', v)} defaultValue={editing?.roleId}>
                <SelectTrigger><SelectValue placeholder="Choisir un rôle" /></SelectTrigger>
                <SelectContent>{roles.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
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

const ROLE_COLORS: Record<string, string> = { ADMIN: 'error', MANAGER: 'info', CASHIER: 'success', WAREHOUSE: 'warning' }

export default function UsersPage() {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(''); const [showForm, setShowForm] = useState(false); const [editing, setEditing] = useState<any>(null)
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['users', page, search], queryFn: async () => { const r = await api.get('/users', { params: { page, limit: 15, search: search || undefined } }); return r.data } })
  const del = useMutation({ mutationFn: (id: string) => api.delete(`/users/${id}`), onSuccess: () => { toast.success('Supprimé'); qc.invalidateQueries({ queryKey: ['users'] }) } })
  const items = data?.data || []; const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold">Utilisateurs</h2><p className="text-xs text-muted-foreground">{meta.total || 0} utilisateurs</p></div>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Nouvel utilisateur</Button>
      </div>
      <Card>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Nom, email..."
              className="w-full h-8 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" />
          </div>
        </div>
        {isLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun utilisateur" action={<Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Ajouter</Button>} />
          : (<>
            <Table>
              <TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Créé le</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold text-primary">{u.firstName[0]}{u.lastName[0]}</span></div>
                        <span className="text-sm font-medium">{u.firstName} {u.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell><span className="text-sm text-muted-foreground">{u.email}</span></TableCell>
                    <TableCell>
                      <Badge variant={ROLE_COLORS[u.role?.name] as any || 'muted'}>
                        <Shield className="h-3 w-3" />{u.role?.name}
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-xs text-muted-foreground">{formatDate(u.createdAt)}</span></TableCell>
                    <TableCell><Badge variant={u.isActive ? 'success' : 'error'}>{u.isActive ? 'Actif' : 'Inactif'}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(u); setShowForm(true) }}><Edit className="h-4 w-4" /> Modifier</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onClick={() => del.mutate(u.id)}><Trash2 className="h-4 w-4" /> Supprimer</DropdownMenuItem>
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
      {showForm && <UserForm editing={editing} onClose={() => { setEditing(null); setShowForm(false) }} />}
    </div>
  )
}
