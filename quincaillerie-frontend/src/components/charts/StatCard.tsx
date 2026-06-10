import { cn, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: number
  isCurrency?: boolean
  colorClass?: string
  loading?: boolean
}

export function StatCard({ title, value, subtitle, icon, trend, isCurrency, colorClass = 'text-primary', loading }: StatCardProps) {
  const displayValue = isCurrency && typeof value === 'number' ? formatCurrency(value) : value

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-current/10', colorClass)}>
          <span className={cn('', colorClass)}>{icon}</span>
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
            trend > 0 ? 'bg-success/10 text-success' : trend < 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
          )}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <div className="h-7 w-32 bg-secondary animate-pulse rounded" />
          <div className="h-4 w-20 bg-secondary animate-pulse rounded" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-bold text-foreground font-mono leading-tight">{displayValue}</p>
          <p className="text-xs text-muted-foreground mt-1">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>}
        </>
      )}
    </div>
  )
}
