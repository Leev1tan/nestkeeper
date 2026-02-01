import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  advertising: 'Advertising',
  auto_travel: 'Auto and travel',
  cleaning_maintenance: 'Cleaning and maintenance',
  commissions: 'Commissions',
  insurance: 'Insurance',
  legal_professional: 'Legal and other professional fees',
  management_fees: 'Management fees',
  mortgage_interest: 'Mortgage interest paid to banks, etc.',
  other_interest: 'Other interest',
  repairs: 'Repairs',
  supplies: 'Supplies',
  taxes: 'Taxes',
  utilities: 'Utilities',
  depreciation: 'Depreciation expense or depletion',
  other: 'Other expenses',
}

export function Reports() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  const { data: taxReport, isLoading } = useQuery({
    queryKey: ['taxReport', selectedYear],
    queryFn: () => api.getTaxReport(selectedYear),
  })

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Reports</h1>
          <p className="text-muted-foreground">Schedule E summary for tax filing</p>
        </div>
        <Select
          value={selectedYear.toString()}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="w-32"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !taxReport ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No data for {selectedYear}</h3>
            <p className="text-muted-foreground">
              Add properties, collect rent, and track expenses to see your tax report.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(taxReport.totals.totalRents)}
                    </p>
                    <p className="text-sm text-muted-foreground">Gross Rents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(taxReport.totals.totalExpenses)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Expenses</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className={`h-5 w-5 ${taxReport.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className={`text-2xl font-bold ${taxReport.totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(taxReport.totals.netIncome)}
                    </p>
                    <p className="text-sm text-muted-foreground">Net Income</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expense Breakdown by Category (Schedule E format) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Schedule E - Expenses by Category</span>
                <Button variant="outline" size="sm" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([key, label]) => {
                  const amount = taxReport.totals.byCategory?.[key] || 0
                  if (amount === 0) return null
                  return (
                    <div key={key} className="flex justify-between py-2 border-b last:border-0">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  )
                })}
                {Object.values(taxReport.totals.byCategory || {}).every((v) => v === 0) && (
                  <p className="text-muted-foreground text-center py-4">
                    No expenses recorded for {selectedYear}
                  </p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
                <span>Total Expenses</span>
                <span>{formatCurrency(taxReport.totals.totalExpenses)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Per-Property Breakdown */}
          {taxReport.properties && taxReport.properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Income & Expenses by Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {taxReport.properties.map((prop) => (
                    <div key={prop.propertyId} className="p-4 border rounded-lg">
                      <p className="font-medium mb-2">{prop.address}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Rental Income</p>
                          <p className="font-medium text-green-600">
                            {formatCurrency(prop.income.rentsReceived)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Expenses</p>
                          <p className="font-medium text-red-600">
                            {formatCurrency(
                              Object.values(prop.expenses).reduce((a, b) => a + b, 0)
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Net Income</p>
                          <p className={`font-medium ${prop.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(prop.netIncome)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tax Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Tax Filing Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Report rental income and expenses on Schedule E (Form 1040)</li>
                <li>• Keep receipts for all expenses over $75</li>
                <li>• Depreciation can significantly reduce taxable income</li>
                <li>• Consult a tax professional for complex situations</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
