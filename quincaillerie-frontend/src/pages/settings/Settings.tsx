import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Settings2, Building2, Receipt, Warehouse, Bell } from 'lucide-react'
import { api, extractData } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, Input, FormField, Spinner } from '@/components/ui/index'
import { toast } from '@/store/ui.store'
import { useEffect } from 'react'

function SettingsSection({ title, icon: Icon, fields, settings, onSave }: any) {
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (settings) { const vals: any = {}; fields.forEach((f: any) => { vals[f.key] = settings[f.key] || '' }); reset(vals) } }, [settings])
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f: any) => (
            <FormField key={f.key} label={f.label}>
              <Input {...register(f.key)} placeholder={f.placeholder} type={f.type || 'text'} />
            </FormField>
          ))}
          <div className="col-span-full flex justify-end mt-2">
            <Button type="submit" size="sm">Enregistrer</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Settings() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const r = await api.get('/settings'); return extractData<any>(r) },
  })
  const settings = data?.map || {}

  const saveMutation = useMutation({
    mutationFn: (updates: Record<string, string>) =>
      api.post('/settings/bulk', { settings: Object.entries(updates).map(([key, value]) => ({ key, value: String(value) })) }),
    onSuccess: () => { toast.success('Paramètres sauvegardés'); qc.invalidateQueries({ queryKey: ['settings'] }) },
    onError: () => toast.error('Erreur sauvegarde'),
  })

  if (isLoading) return <div className="h-64 flex items-center justify-center"><Spinner /></div>

  const sections = [
    {
      title: 'Informations de l\'entreprise', icon: Building2,
      fields: [
        { key: 'company_name', label: 'Nom de l\'entreprise', placeholder: 'Ex: Quincaillerie Diallo' },
        { key: 'company_phone', label: 'Téléphone', placeholder: '+221 77 000 00 00' },
        { key: 'company_address', label: 'Adresse', placeholder: 'Dakar, Sénégal' },
        { key: 'company_email', label: 'Email', placeholder: 'contact@quincaillerie.com', type: 'email' },
      ]
    },
    {
      title: 'Paramètres généraux', icon: Settings2,
      fields: [
        { key: 'currency', label: 'Devise', placeholder: 'FCFA' },
        { key: 'tax_rate', label: 'Taux TVA (%)', placeholder: '18', type: 'number' },
      ]
    },
    {
      title: 'Facturation', icon: Receipt,
      fields: [
        { key: 'invoice_prefix', label: 'Préfixe facture', placeholder: 'FAC' },
        { key: 'sale_prefix', label: 'Préfixe vente', placeholder: 'VNT' },
        { key: 'purchase_prefix', label: 'Préfixe achat', placeholder: 'ACH' },
      ]
    },
    {
      title: 'Stock', icon: Warehouse,
      fields: [
        { key: 'low_stock_alert', label: 'Seuil alerte stock', placeholder: '5', type: 'number' },
      ]
    },
  ]

  return (
    <div className="space-y-5 max-w-3xl">
      <div><h2 className="text-lg font-semibold">Paramètres</h2><p className="text-xs text-muted-foreground">Configuration de l'application</p></div>
      {sections.map((s) => (
        <SettingsSection key={s.title} {...s} settings={settings} onSave={(vals: any) => saveMutation.mutate(vals)} />
      ))}
    </div>
  )
}
