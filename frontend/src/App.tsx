import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/lib/auth'
import { Layout } from '@/components/layout/Layout'
import { Landing } from '@/pages/Landing'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Properties } from '@/pages/Properties'
import { Tenants } from '@/pages/Tenants'
import { Leases } from '@/pages/Leases'
import { Rent } from '@/pages/Rent'
import { Maintenance } from '@/pages/Maintenance'
import { Expenses } from '@/pages/Expenses'
import { Reports } from '@/pages/Reports'
import { Settings } from '@/pages/Settings'
import { Energy } from '@/pages/Energy'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // If logged in, redirect to app
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
      <Route path="/login" element={<Login />} />

      {/* Protected app routes */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/properties" element={<Properties />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/leases" element={<Leases />} />
                <Route path="/rent" element={<Rent />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/energy" element={<Energy />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Redirect old routes to /app */}
      <Route path="/properties" element={<Navigate to="/app/properties" replace />} />
      <Route path="/tenants" element={<Navigate to="/app/tenants" replace />} />
      <Route path="/leases" element={<Navigate to="/app/leases" replace />} />
      <Route path="/rent" element={<Navigate to="/app/rent" replace />} />
      <Route path="/maintenance" element={<Navigate to="/app/maintenance" replace />} />
      <Route path="/expenses" element={<Navigate to="/app/expenses" replace />} />
      <Route path="/reports" element={<Navigate to="/app/reports" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
