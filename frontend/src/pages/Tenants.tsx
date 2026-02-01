import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api, type CreateTenantData } from '@/lib/api'

export function Tenants() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: api.getTenants,
  })

  const createMutation = useMutation({
    mutationFn: api.createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setShowForm(false)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreateTenantData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string,
      notes: formData.get('notes') as string || undefined,
    }
    createMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground">{tenants?.length ?? 0} tenants</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tenant
        </Button>
      </div>

      {/* Add Tenant Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input name="firstName" required placeholder="John" />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input name="lastName" required placeholder="Smith" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input name="phone" type="tel" required placeholder="(555) 123-4567" />
              </div>

              <div>
                <label className="text-sm font-medium">Email (optional)</label>
                <Input name="email" type="email" placeholder="john@example.com" />
              </div>

              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input name="notes" placeholder="Any additional notes..." />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Tenant'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tenants List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !tenants || tenants.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No tenants yet</h3>
            <p className="text-muted-foreground">
              Add tenants before creating leases
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {tenant.firstName[0]}{tenant.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {tenant.firstName} {tenant.lastName}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {tenant.phone}
                        </span>
                        {tenant.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {tenant.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {tenant.notes && (
                  <p className="mt-2 text-sm text-muted-foreground">{tenant.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
