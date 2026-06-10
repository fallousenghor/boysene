import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import {
  LayoutDashboard, Package, Tags, Layers, Users, Truck,
  ShoppingCart, Receipt, CreditCard, FileText, MessageCircle,
  BarChart3, Settings, ChevronLeft, Wrench, Warehouse, TrendingUp, Building2
} from 'lucide-react'

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/products', icon: Package, label: 'Produits' },
      { to: '/categories', icon: Tags, label: 'Catégories' },
      { to: '/brands', icon: Layers, label: 'Marques' },
      { to: '/stocks', icon: Warehouse, label: 'Stocks' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/customers', icon: Users, label: 'Clients' },
      { to: '/suppliers', icon: Truck, label: 'Fournisseurs' },
      { to: '/purchases', icon: ShoppingCart, label: 'Achats' },
      { to: '/sales', icon: Receipt, label: 'Ventes' },
      { to: '/payments', icon: CreditCard, label: 'Paiements' },
    ],
  },
  {
    label: 'Documents',
    items: [
      { to: '/invoices', icon: FileText, label: 'Factures' },
      { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { to: '/reports', icon: BarChart3, label: 'Rapports' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/users', icon: Users, label: 'Utilisateurs', adminOnly: true },
      { to: '/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()
  const location = useLocation()
  const isAdmin = user?.role?.name === 'ADMIN'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full z-40 flex flex-col bg-card border-r border-border transition-all duration-300',
        sidebarCollapsed ? 'w-[60px]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 h-[var(--header-height)] px-4 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Wrench className="h-4 w-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-foreground leading-tight">QuincaPro</p>
            <p className="text-[10px] text-muted-foreground leading-tight">Gestion Quincaillerie</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-none py-3 px-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(item => !('adminOnly' in item && item.adminOnly && !isAdmin))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">
                  {group.label}
                </p>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn('nav-item', isActive && 'active', sidebarCollapsed && 'justify-center px-0')}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User */}
      {!sidebarCollapsed && user && (
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {user.firstName[0]}{user.lastName[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] text-muted-foreground">{user.role?.name}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
