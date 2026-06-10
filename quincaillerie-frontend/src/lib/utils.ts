import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'FCFA'): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' ' + currency
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function formatDatetime(date: string | Date): string {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelative(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (mins < 1) return 'À l\'instant'
  if (mins < 60) return `Il y a ${mins}min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return formatDate(date)
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function truncate(str: string, max = 30): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export const statusConfig: Record<string, { label: string; class: string }> = {
  PAID:      { label: 'Payé',        class: 'badge-paid' },
  PARTIAL:   { label: 'Partiel',     class: 'badge-partial' },
  PENDING:   { label: 'En attente',  class: 'badge-pending' },
  CANCELLED: { label: 'Annulé',      class: 'badge-cancelled' },
  DRAFT:     { label: 'Brouillon',   class: 'badge-draft' },
  ORDERED:   { label: 'Commandé',    class: 'badge-partial' },
  RECEIVED:  { label: 'Reçu',        class: 'badge-paid' },
  ACTIVE:    { label: 'Actif',       class: 'badge-paid' },
  INACTIVE:  { label: 'Inactif',     class: 'badge-cancelled' },
  SENT:      { label: 'Envoyé',      class: 'badge-partial' },
}
