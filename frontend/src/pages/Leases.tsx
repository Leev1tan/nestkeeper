import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Plus, Calendar, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { api, type CreateLeaseData, type Unit, type Property } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export function Leases() {
  const [showForm, setShowForm] = useState(false)
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const queryClient = useQueryClient()

  const { data: leases, isLoading } = useQuery({
    queryKey: ['leases'],
    queryFn: () => api.getLeases(),
  })

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.getUnits(),
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  })

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: api.getTenants,
  })

  const createMutation = useMutation({
    mutationFn: api.createLease,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leases'] })
      queryClient.invalidateQueries({ queryKey: ['units'] })
      queryClient.invalidateQueries({ queryKey: ['rentStatus'] })
      setShowForm(false)
      setSelectedTenants([])
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (selectedTenants.length === 0) {
      alert('Please select at least one tenant')
      return
    }

    const formData = new FormData(e.currentTarget)
    const data: CreateLeaseData = {
      unitId: formData.get('unitId') as string,
      tenantIds: selectedTenants,
      primaryTenantId: selectedTenants[0],
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      monthlyRent: parseFloat(formData.get('monthlyRent') as string),
      securityDeposit: parseFloat(formData.get('securityDeposit') as string),
      rentDueDay: parseInt(formData.get('rentDueDay') as string) || 1,
    }
    createMutation.mutate(data)
  }

  const toggleTenant = (tenantId: string) => {
    setSelectedTenants((prev) =>
      prev.includes(tenantId)
        ? prev.filter((id) => id !== tenantId)
        : [...prev, tenantId]
    )
  }

  const getPropertyForUnit = (unitId: string): Property | undefined => {
    const unit = units?.find((u) => u.id === unitId)
    return properties?.find((p) => p.id === unit?.propertyId)
  }

  const getUnitWithProperty = (unit: Unit) => {
    const property = properties?.find((p) => p.id === unit.propertyId)
    return `${property?.addressStreet || 'Unknown'} - ${unit.name}`
  }

  const vacantUnits = units?.filter((u) => u.status === 'vacant') ?? []

  // Calculate default end date (1 year from start)
  const getDefaultEndDate = () => {
    const date = new Date()
    date.setFullYear(date.getFullYear() + 1)
    return date.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leases</h1>
          <p className="text-muted-foreground">
            {leases?.filter((l) => l.status === 'active').length ?? 0} active leases
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={vacantUnits.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          New Lease
        </Button>
      </div>

      {vacantUnits.length === 0 && !showForm && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <p className="text-amber-800 text-sm">
              No vacant units available. Add a property or mark a unit as vacant to create a lease.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Lease Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Lease</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Unit</label>
                <Select name="unitId" required>
                  <option value="">Select a vacant unit</option>
                  {vacantUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {getUnitWithProperty(unit)} ({formatCurrency(unit.monthlyRent)}/mo)
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tenants</label>
                {!tenants || tenants.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No tenants available. <a href="/tenants" className="text-primary underline">Add a tenant first</a>.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {tenants.map((tenant) => (
                      <button
                        key={tenant.id}
                        type="button"
                        onClick={() => toggleTenant(tenant.id)}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          selectedTenants.includes(tenant.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-input hover:bg-accent'
                        }`}
                      >
                        <p className="font-medium text-sm">
                          {tenant.firstName} {tenant.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{tenant.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedTenants.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedTenants.length} tenant(s) selected. First selected is primary.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    name="startDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    name="endDate"
                    type="date"
                    required
                    defaultValue={getDefaultEndDate()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Monthly Rent</label>
                  <Input
                    name="monthlyRent"
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Security Deposit</label>
                  <Input
                    name="securityDeposit"
                    type="number"
                    step="0.01"
                    required
                    placeholder="1500.00"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Rent Due Day</label>
                <Select name="rentDueDay">
                  {[1, 5, 10, 15].map((day) => (
                    <option key={day} value={day}>
                      {day === 1 ? '1st' : `${day}th`} of each month
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setSelectedTenants([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || selectedTenants.length === 0}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Lease'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leases List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !leases || leases.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No leases yet</h3>
            <p className="text-muted-foreground">
              Create a lease to start tracking rent
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => {
            const property = getPropertyForUnit(lease.unitId)
            const unit = units?.find((u) => u.id === lease.unitId)

            return (
              <Card
                key={lease.id}
                className={lease.status !== 'active' ? 'opacity-60' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {property?.addressStreet || 'Unknown Property'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {unit?.name || 'Unknown Unit'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(lease.startDate)} - {formatDate(lease.endDate)}
                        </span>
                        <span className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(lease.monthlyRent)}/mo
                        </span>
                      </div>
                      {lease.tenants && lease.tenants.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Tenants: {lease.tenants.map((t) => `${t.firstName} ${t.lastName}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        lease.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : lease.status === 'expired'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {lease.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
