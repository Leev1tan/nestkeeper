import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DollarSign, Plus, Check, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { api, type CreatePaymentData, type UnitRentStatus } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export function Rent() {
  const [selectedUnit, setSelectedUnit] = useState<UnitRentStatus | null>(null)
  const queryClient = useQueryClient()

  const { data: rentStatus, isLoading } = useQuery({
    queryKey: ['rentStatus'],
    queryFn: () => api.getRentStatus(),
  })

  const paymentMutation = useMutation({
    mutationFn: api.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rentStatus'] })
      setSelectedUnit(null)
    },
  })

  const handlePayment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUnit || !rentStatus) return

    const formData = new FormData(e.currentTarget)
    const data: CreatePaymentData = {
      leaseId: selectedUnit.leaseId,
      amount: parseFloat(formData.get('amount') as string),
      paymentDate: formData.get('paymentDate') as string,
      periodStart: rentStatus.period.start,
      periodEnd: rentStatus.period.end,
      method: formData.get('method') as string,
    }
    paymentMutation.mutate(data)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-5 w-5 text-green-600" />
      case 'partial':
        return <Clock className="h-5 w-5 text-amber-600" />
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'partial':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rent Tracking</h1>
        <p className="text-muted-foreground">
          {rentStatus ? `${new Date(rentStatus.period.start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}` : 'Loading...'}
        </p>
      </div>

      {/* Summary Cards */}
      {rentStatus && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(rentStatus.summary.totalReceived)}
              </p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(rentStatus.summary.totalOutstanding)}
              </p>
              <p className="text-sm text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">
                {rentStatus.summary.paidCount}/{rentStatus.units?.length ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Paid</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Form */}
      {selectedUnit && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Log Payment - {selectedUnit.property.address}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Unit:</strong> {selectedUnit.unit.name}</p>
                <p><strong>Tenant:</strong> {selectedUnit.tenants.map(t => t.name).join(', ') || 'No tenant'}</p>
                <p><strong>Amount Due:</strong> {formatCurrency(selectedUnit.amountDue)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedUnit.balance)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={selectedUnit.balance}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    name="paymentDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Payment Method</label>
                <Select name="method" required>
                  <option value="zelle">Zelle</option>
                  <option value="venmo">Venmo</option>
                  <option value="check">Check</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setSelectedUnit(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={paymentMutation.isPending}>
                  {paymentMutation.isPending ? 'Saving...' : 'Log Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Units List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !rentStatus?.units || rentStatus.units.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No active leases</h3>
            <p className="text-muted-foreground">
              Create a lease for a unit to start tracking rent
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rentStatus?.units?.map((unit) => (
            <Card
              key={unit.leaseId}
              className={`border-l-4 ${getStatusColor(unit.status)}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(unit.status)}
                    <div>
                      <p className="font-medium">{unit.property.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {unit.unit.name} • {unit.tenants.map(t => t.name).join(', ') || 'No tenant'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(unit.amountDue)}</p>
                    {unit.totalPaid > 0 && (
                      <p className="text-sm text-green-600">
                        Paid: {formatCurrency(unit.totalPaid)}
                      </p>
                    )}
                    {unit.status === 'overdue' && (
                      <p className="text-xs text-red-600">{unit.daysOverdue} days overdue</p>
                    )}
                  </div>
                </div>

                {unit.payments.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Recent payments:</p>
                    {unit.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span>{formatDate(p.date)} via {p.method}</span>
                        <span>{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {unit.status !== 'paid' && (
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setSelectedUnit(unit)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Log Payment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
