import * as React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ── Input ──────────────────────────────────────────────────
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, ...props }, ref) => (
    <div className="w-full">
      <div className={cn('relative flex items-center input-glow rounded-lg', error && 'ring-1 ring-destructive')}>
        {icon && (
          <span className="absolute left-3 text-muted-foreground pointer-events-none">{icon}</span>
        )}
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            icon && 'pl-9',
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

// ── Textarea ───────────────────────────────────────────────
const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-colors disabled:cursor-not-allowed disabled:opacity-50 resize-none',
          error && 'border-destructive',
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
)
Textarea.displayName = 'Textarea'

// ── Label ──────────────────────────────────────────────────
const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('block text-xs font-medium text-muted-foreground mb-1.5', className)} {...props} />
  )
)
Label.displayName = 'Label'

// ── Badge ──────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'muted'
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-primary/10 text-primary border-primary/20',
      success: 'bg-success/10 text-success border-success/20',
      warning: 'bg-warning/10 text-warning border-warning/20',
      error: 'bg-destructive/10 text-destructive border-destructive/20',
      info: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
      muted: 'bg-muted text-muted-foreground border-border',
    }
    return (
      <span
        ref={ref}
        className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border', variants[variant], className)}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

// ── Card ──────────────────────────────────────────────────
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-xl border border-border bg-card', className)} {...props} />
  )
)
Card.displayName = 'Card'

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between px-5 py-4 border-b border-border', className)} {...props} />
)
const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-semibold text-sm text-foreground', className)} {...props} />
)
const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props} />
)
const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('px-5 py-3 border-t border-border', className)} {...props} />
)

// ── Spinner ───────────────────────────────────────────────
const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={cn('animate-spin text-primary', className)} />
)

// ── Separator ─────────────────────────────────────────────
const Separator = ({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) => (
  <div className={cn(orientation === 'horizontal' ? 'h-px w-full bg-border' : 'h-full w-px bg-border', className)} />
)

// ── Empty state ───────────────────────────────────────────
const EmptyState = ({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>}
    {action}
  </div>
)

// ── Form Field ─────────────────────────────────────────────
const FormField = ({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

export { Input, Textarea, Label, Badge, Card, CardHeader, CardTitle, CardContent, CardFooter, Spinner, Separator, EmptyState, FormField }
