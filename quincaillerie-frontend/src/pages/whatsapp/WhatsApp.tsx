import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageCircle, CheckCheck, Clock, AlertCircle, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { Card, Spinner, EmptyState, Badge } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  SENT:      { label: 'Envoyé',   icon: Check,      color: 'text-primary' },
  DELIVERED: { label: 'Livré',    icon: CheckCheck,  color: 'text-primary' },
  READ:      { label: 'Lu',       icon: CheckCheck,  color: 'text-success' },
  PENDING:   { label: 'En attente', icon: Clock,     color: 'text-warning' },
  FAILED:    { label: 'Échec',    icon: AlertCircle, color: 'text-destructive' },
}

export default function WhatsApp() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp', page],
    queryFn: async () => { const r = await api.get('/whatsapp/history', { params: { page, limit: 20 } }); return r.data },
  })
  const items = data?.data || []; const meta = data?.meta || {}

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-success" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">WhatsApp Business</h2>
          <p className="text-xs text-muted-foreground">{meta.total || 0} messages envoyés</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon
          const count = items.filter((m: any) => m.status === status).length
          return (
            <div key={status} className="stat-card">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', `${cfg.color}/10 bg-current/5`)}><Icon className={cn('h-4 w-4', cfg.color)} /></div>
              <p className="text-xl font-bold font-mono">{count}</p>
              <p className="text-xs text-muted-foreground">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      <Card>
        {isLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Aucun message" description="Les messages WhatsApp apparaissent ici automatiquement." />
          : (<>
            <Table>
              <TableHeader><TableRow><TableHead>Destinataire</TableHead><TableHead>Type</TableHead><TableHead>Message</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((m: any) => {
                  const sc = STATUS_CONFIG[m.status]
                  const Icon = sc?.icon || Clock
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{m.customer?.name || m.supplier?.name || m.recipient}</p>
                          <p className="text-xs text-muted-foreground font-mono">{m.recipient}</p>
                        </div>
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{m.messageType}</span></TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground max-w-xs truncate">{m.content}</p>
                      </TableCell>
                      <TableCell>
                        <div className={cn('flex items-center gap-1.5 text-xs font-medium', sc?.color || 'text-muted-foreground')}>
                          <Icon className="h-3.5 w-3.5" />{sc?.label || m.status}
                        </div>
                        {m.errorMessage && <p className="text-[10px] text-destructive mt-0.5">{m.errorMessage}</p>}
                      </TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</span></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={meta.pages || 1} total={meta.total || 0} limit={20} onPageChange={setPage} />
          </>)}
      </Card>
    </div>
  )
}
