import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { api, type CreatePropertyData } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function Properties() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  })

  const { data: units } = useQuery({
    queryKey: ['units'],
    queryFn: () => api.getUnits(),
  })

  const createMutation = useMutation({
    mutationFn: api.createProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      queryClient.invalidateQueries({ queryKey: ['units'] })
      setShowForm(false)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreatePropertyData = {
      addressStreet: formData.get('addressStreet') as string,
      addressCity: formData.get('addressCity') as string,
      addressState: formData.get('addressState') as string,
      addressZip: formData.get('addressZip') as string,
      propertyType: formData.get('propertyType') as string,
    }
    createMutation.mutate(data)
  }

  const getPropertyUnits = (propertyId: string) => {
    return units?.filter((u) => u.propertyId === propertyId) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-muted-foreground">{properties?.length ?? 0} properties</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Add Property Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Street Address</label>
                <Input name="addressStreet" required placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">City</label>
                  <Input name="addressCity" required placeholder="Austin" />
                </div>
                <div>
                  <label className="text-sm font-medium">State</label>
                  <Input name="addressState" required placeholder="TX" maxLength={2} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">ZIP Code</label>
                  <Input name="addressZip" required placeholder="78701" />
                </div>
                <div>
                  <label className="text-sm font-medium">Property Type</label>
                  <Select name="propertyType" required>
                    <option value="single_family">Single Family</option>
                    <option value="multi_family">Multi Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Property'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Properties List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : properties?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground">
              Click "Add Property" to add your first rental property
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties?.map((property) => {
            const propertyUnits = getPropertyUnits(property.id)
            const totalRent = propertyUnits.reduce((sum, u) => sum + u.monthlyRent, 0)
            const occupiedCount = propertyUnits.filter((u) => u.status === 'occupied').length

            return (
              <Card key={property.id} className="hover:bg-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{property.addressStreet}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {property.addressCity}, {property.addressState} {property.addressZip}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>{propertyUnits.length} unit{propertyUnits.length !== 1 ? 's' : ''}</span>
                          <span>{occupiedCount} occupied</span>
                          <span className="text-green-600">{formatCurrency(totalRent)}/mo</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full capitalize">
                      {property.propertyType.replace('_', ' ')}
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
