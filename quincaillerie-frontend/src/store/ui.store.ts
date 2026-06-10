import { create } from 'zustand'

interface Toast {
  id: string
  title: string
  description?: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

export const toast = {
  success: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, type: 'success' }),
  error: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, type: 'error' }),
  warning: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, type: 'warning' }),
  info: (title: string, description?: string) =>
    useUIStore.getState().addToast({ title, description, type: 'info' }),
}
