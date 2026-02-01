import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { api, type CreateExpenseData } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
  { value: 'repairs', label: 'Repairs' },
  { value: 'cleaning_maintenance', label: 'Cleaning & Maintenance' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'mortgage_interest', label: 'Mortgage Interest' },
  { value: 'management_fees', label: 'Management Fees' },
  { value: 'legal_professional', label: 'Legal & Professional' },
  { value: 'advertising', label: 'Advertising' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'auto_travel', label: 'Auto & Travel' },
  { value: 'other', label: 'Other' },
]

export function Expenses() {
  const [showForm, setShowForm] = useState(false)
  const queryClient = useQueryClient()

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.getExpenses(),
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  })

  const createMutation = useMutation({
    mutationFn: api.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      setShowForm(false)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data: CreateExpenseData = {
      propertyId: formData.get('propertyId') as string || undefined,
      amount: parseFloat(formData.get('amount') as string),
      date: formData.get('date') as string,
      category: formData.get('category') as string,
      vendor: formData.get('vendor') as string || undefined,
      description: formData.get('description') as string || undefined,
    }
    createMutation.mutate(data)
  }

  const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0
  const categoryTotals = expenses?.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {} as Record<string, number>) ?? {}

  const getPropertyAddress = (propertyId?: string) => {
    if (!propertyId) return 'General'
    const property = properties?.find(p => p.id === propertyId)
    return property ? `${property.addressStreet}` : 'Unknown'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            {formatCurrency(totalExpenses)} total this year
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Category Summary */}
      {Object.keys(categoryTotals).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([category, total]) => (
                  <div key={category} className="flex justify-between py-1">
                    <span className="text-muted-foreground capitalize">
                      {category.replace('_', ' ')}
                    </span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Category</label>
                <Select name="category" required>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Property (optional)</label>
                <Select name="propertyId">
                  <option value="">General expense</option>
                  {properties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.addressStreet}, {p.addressCity}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Vendor (optional)</label>
                <Input name="vendor" placeholder="Home Depot, Plumber, etc." />
              </div>

              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input name="description" placeholder="What was this expense for?" />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Expense'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : expenses?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No expenses recorded</h3>
            <p className="text-muted-foreground">
              Track your property expenses for tax time
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses?.map((expense) => (
            <Card key={expense.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {expense.vendor || expense.description || 'Expense'}
                    </p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{getPropertyAddress(expense.propertyId)}</span>
                      <span>•</span>
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  <p className="font-semibold text-lg">{formatCurrency(expense.amount)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
