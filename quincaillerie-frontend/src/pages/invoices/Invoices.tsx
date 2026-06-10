import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, statusConfig, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, Spinner, EmptyState } from '@/components/ui/index'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '@/components/ui/Table'
import { toast } from '@/store/ui.store'

const TYPE_LABELS: Record<string, string> = { SALE: 'Vente', PURCHASE: 'Achat', CREDIT_NOTE: 'Avoir', RECEIPT: 'Reçu', QUOTE: 'Devis' }
const TYPE_COLORS: Record<string, string> = { SALE: 'text-primary', PURCHASE: 'text-warning', CREDIT_NOTE: 'text-accent', RECEIPT: 'text-success', QUOTE: 'text-muted-foreground' }

export default function Invoices() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page],
    queryFn: async () => { const r = await api.get('/invoices', { params: { page, limit: 15 } }); return r.data },
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfName, setPdfName] = useState<string>('facture.pdf')
  const [pdfLoading, setPdfLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const openPdfInline = async (id: string, num?: string) => {
    setPdfLoading(true)
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      setPdfName(num ? `${num}.pdf` : 'facture.pdf')
      setPdfUrl(url)
      setDialogOpen(true)
    } catch (e) {
      console.error(e)
      toast.error('Erreur PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const closeDialog = () => {
    setDialogOpen(false)
    if (pdfUrl) {
      // revoke after a short delay to allow iframe to release handle
      setTimeout(() => { try { URL.revokeObjectURL(pdfUrl) } catch {} }, 500)
      setPdfUrl(null)
    }
  }

  const downloadCurrentPdf = () => {
    if (!pdfUrl) return
    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = pdfName
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const printCurrentPdf = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.focus()
        iframeRef.current.contentWindow.print()
      } else if (pdfUrl) {
        // fallback: open in new tab and print
        const w = window.open(pdfUrl)
        if (w) w.print()
      }
    } catch (e) {
      console.error(e)
      toast.error('Impossible d\'imprimer le document')
    }
  }

  const items = Array.isArray(data) ? data : data?.data || []
  const meta = Array.isArray(data) ? { total: data.length, pages: 1 } : data?.meta || {}

  return (
    <div className="space-y-5">
      <div><h2 className="text-lg font-semibold">Factures</h2><p className="text-xs text-muted-foreground">{meta.total || 0} documents</p></div>
      <Card>
        {isLoading ? <div className="h-48 flex items-center justify-center"><Spinner /></div>
          : items.length === 0 ? <EmptyState icon={<FileText className="h-6 w-6" />} title="Aucune facture" description="Les factures sont générées automatiquement." />
          : (<>
            <Table>
              <TableHeader><TableRow><TableHead>N° Facture</TableHead><TableHead>Type</TableHead><TableHead>Client/Fournisseur</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map((inv: any) => {
                  const sc = statusConfig[inv.status] || {}
                  return (
                    <TableRow key={inv.id}>
                      <TableCell><span className="font-mono text-xs text-primary font-semibold">{inv.number}</span></TableCell>
                      <TableCell><span className={cn('text-xs font-medium', TYPE_COLORS[inv.type])}>{TYPE_LABELS[inv.type] || inv.type}</span></TableCell>
                      <TableCell><span className="text-sm">{inv.customer?.name || inv.supplier?.name || '—'}</span></TableCell>
                      <TableCell><span className="text-xs text-muted-foreground">{formatDate(inv.issueDate)}</span></TableCell>
                      <TableCell><span className="text-sm font-mono font-bold">{formatCurrency(inv.total)}</span></TableCell>
                      <TableCell><span className={cn('text-xs px-2 py-0.5 rounded-md border font-medium', sc.class)}>{sc.label}</span></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm" onClick={() => openPdfInline(inv.id, inv.number)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={meta.pages || 1} total={meta.total || 0} limit={15} onPageChange={setPage} />
          </>)}
      </Card>
      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent size="xl">
          <DialogHeader><DialogTitle>Facture</DialogTitle></DialogHeader>
          <div className="p-4" style={{ height: '70vh' }}>
            {pdfLoading ? (
              <div className="h-full flex items-center justify-center"><Spinner /></div>
            ) : pdfUrl ? (
              <iframe ref={iframeRef} title="Facture" src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
            ) : <div className="h-full flex items-center justify-center">Chargement…</div>}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={printCurrentPdf} disabled={!pdfUrl}>
                <Send className="h-4 w-4 mr-2" /> Imprimer
              </Button>
              <Button variant="secondary" onClick={downloadCurrentPdf} disabled={!pdfUrl}>
                <Download className="h-4 w-4 mr-2" /> Télécharger
              </Button>
              <Button onClick={closeDialog}>Fermer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
