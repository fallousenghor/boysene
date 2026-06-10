import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Toaster } from '@/components/ui/Toast'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/products': 'Produits',
  '/categories': 'Catégories',
  '/brands': 'Marques',
  '/stocks': 'Gestion des stocks',
  '/customers': 'Clients',
  '/suppliers': 'Fournisseurs',
  '/purchases': 'Achats',
  '/sales': 'Ventes',
  '/payments': 'Paiements',
  '/invoices': 'Factures',
  '/whatsapp': 'WhatsApp',
  '/reports': 'Rapports',
  '/users': 'Utilisateurs',
  '/settings': 'Paramètres',
}

export function AppLayout() {
  const { sidebarCollapsed } = useUIStore()
  const location = useLocation()
  const pathname = '/' + location.pathname.split('/')[1]
  const title = pageTitles[pathname] || 'QuincaPro'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className={cn('flex-1 flex flex-col min-w-0 transition-all duration-300', sidebarCollapsed ? 'ml-[60px]' : 'ml-[var(--sidebar-width)]')}>
        <Header title={title} />
        <main className="flex-1 overflow-y-auto pt-[var(--header-height)]">
          <div className="p-5 min-h-full page-enter">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
