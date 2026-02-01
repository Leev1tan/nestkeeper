import { Link, useLocation } from 'react-router-dom'
import { Home, Building, Users, FileSignature, DollarSign, Wrench, Receipt, BarChart3, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

const navItems = [
  { href: '/app', icon: Home, label: 'Home' },
  { href: '/app/properties', icon: Building, label: 'Properties' },
  { href: '/app/tenants', icon: Users, label: 'Tenants' },
  { href: '/app/leases', icon: FileSignature, label: 'Leases' },
  { href: '/app/rent', icon: DollarSign, label: 'Rent' },
  { href: '/app/maintenance', icon: Wrench, label: 'Tasks' },
  { href: '/app/expenses', icon: Receipt, label: 'Expenses' },
  { href: '/app/reports', icon: BarChart3, label: 'Reports' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between px-4">
          <Link to="/app" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">NestKeeper</span>
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.username}
                </span>
                <Link
                  to="/app/settings"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-4 pb-20 md:pb-4">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
        <div className="flex h-16 items-center overflow-x-auto scrollbar-hide">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = location.pathname === href ||
              (href !== '/app' && location.pathname.startsWith(href))

            return (
              <Link
                key={href}
                to={href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-[4.5rem]',
                  'text-xs transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
