import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building, DollarSign, AlertTriangle, Wrench } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function Dashboard() {
  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  })

  const { data: rentStatus } = useQuery({
    queryKey: ['rentStatus'],
    queryFn: () => api.getRentStatus(),
  })

  const { data: overdueTasks } = useQuery({
    queryKey: ['overdueTasks'],
    queryFn: api.getOverdueTasks,
  })

  const stats = [
    {
      label: 'Properties',
      value: properties?.length ?? 0,
      icon: Building,
      href: '/properties',
      color: 'text-blue-600',
    },
    {
      label: 'Rent Collected',
      value: formatCurrency(rentStatus?.summary.totalReceived ?? 0),
      icon: DollarSign,
      href: '/rent',
      color: 'text-green-600',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(rentStatus?.summary.totalOutstanding ?? 0),
      icon: AlertTriangle,
      href: '/rent',
      color: 'text-amber-600',
    },
    {
      label: 'Overdue Tasks',
      value: overdueTasks?.length ?? 0,
      icon: Wrench,
      href: '/maintenance',
      color: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your properties</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Rent Status */}
      {rentStatus && rentStatus.units && rentStatus.units.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rent Status - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rentStatus.units.slice(0, 5).map((unit) => (
                <div
                  key={unit.leaseId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{unit.property.address}</p>
                    <p className="text-sm text-muted-foreground">{unit.unit.name}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        unit.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : unit.status === 'partial'
                          ? 'bg-amber-100 text-amber-700'
                          : unit.status === 'overdue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {unit.status === 'paid' ? 'Paid' :
                       unit.status === 'partial' ? `Partial (${formatCurrency(unit.totalPaid)})` :
                       unit.status === 'overdue' ? `Overdue (${unit.daysOverdue}d)` : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {rentStatus.units && rentStatus.units.length > 5 && (
              <Link to="/rent" className="block mt-4 text-sm text-primary hover:underline">
                View all {rentStatus.units.length} units →
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overdue Tasks */}
      {overdueTasks && overdueTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Overdue Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                  </div>
                  {task.requiredByLaw && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      Required
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Link to="/maintenance" className="block mt-4 text-sm text-primary hover:underline">
              View all tasks →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!properties || properties.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first property to get started
            </p>
            <Link
              to="/properties"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Property
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
