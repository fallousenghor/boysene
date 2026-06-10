import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { AppLayout } from '@/components/layout/AppLayout'
import { ThemeProvider } from '@/hooks/ThemeProvider'
import Login from '@/pages/auth/Login'
import Dashboard from '@/pages/dashboard/Dashboard'
import Products from '@/pages/products/Products'
import Categories from '@/pages/categories/Categories'
import Brands from '@/pages/brands/Brands'
import Stocks from '@/pages/stocks/Stocks'
import Customers from '@/pages/customers/Customers'
import Suppliers from '@/pages/suppliers/Suppliers'
import Purchases from '@/pages/purchases/Purchases'
import Sales from '@/pages/sales/Sales'
import Checkout from '@/pages/sales/Checkout'
import Payments from '@/pages/payments/Payments'
import Invoices from '@/pages/invoices/Invoices'
import WhatsApp from '@/pages/whatsapp/WhatsApp'
import Reports from '@/pages/reports/Reports'
import Settings from '@/pages/settings/Settings'
import Users from '@/pages/users/Users'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user?.role?.name !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/whatsapp" element={<WhatsApp />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="/users"
            element={
              <RequireAdmin>
                <Users />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
