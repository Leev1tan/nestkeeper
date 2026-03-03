import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Zap, Plus, Sun, PlugZap, ArrowUpRight, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { api, type CreateEnergyReadingData } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export function Energy() {
  const [showForm, setShowForm] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const queryClient = useQueryClient()

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  })

  const { data: readings, isLoading } = useQuery({
    queryKey: ['energyReadings', selectedYear],
    queryFn: () => api.getEnergyReadings(undefined, selectedYear),
  })

  const createMutation = useMutation({
    mutationFn: api.createEnergyReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energyReadings'] })
      setShowForm(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: api.deleteEnergyReading,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energyReadings'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const data: CreateEnergyReadingData = {
      propertyId: f.get('propertyId') as string,
      readingDate: f.get('readingDate') as string,
      gridImportKwh: parseFloat(f.get('gridImportKwh') as string) || 0,
      solarGeneratedKwh: parseFloat(f.get('solarGeneratedKwh') as string) || 0,
      gridExportKwh: parseFloat(f.get('gridExportKwh') as string) || 0,
      gridPricePerKwh: parseFloat(f.get('gridPricePerKwh') as string) || 0,
      notes: (f.get('notes') as string) || undefined,
    }
    createMutation.mutate(data)
  }

  // Totals for the year
  const totals = readings?.reduce(
    (acc, r) => ({
      solarGenerated: acc.solarGenerated + r.solarGeneratedKwh,
      gridImport: acc.gridImport + r.gridImportKwh,
      gridExport: acc.gridExport + r.gridExportKwh,
      solarSavings: acc.solarSavings + r.solarSavings,
      gridCost: acc.gridCost + r.gridCost,
      exportEarnings: acc.exportEarnings + r.exportEarnings,
    }),
    { solarGenerated: 0, gridImport: 0, gridExport: 0, solarSavings: 0, gridCost: 0, exportEarnings: 0 }
  )

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Energy</h1>
          <p className="text-muted-foreground text-sm">Solar generation & grid consumption</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            name="year"
            value={selectedYear}
            onChange={(e) => setSelectedYear((e.target as HTMLSelectElement).value)}
            className="w-28"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reading
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Sun className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Solar generated</span>
              </div>
              <div className="text-2xl font-bold">{totals.solarGenerated.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">kWh</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <PlugZap className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">From grid</span>
              </div>
              <div className="text-2xl font-bold">{totals.gridImport.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">kWh</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Solar savings</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totals.solarSavings)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpRight className="h-4 w-4 text-purple-500" />
                <span className="text-xs text-muted-foreground">Exported to grid</span>
              </div>
              <div className="text-2xl font-bold">{totals.gridExport.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">kWh</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Reading Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Monthly Reading</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Property</label>
                  <Select name="propertyId" required>
                    <option value="">Select property</option>
                    {properties?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.addressStreet}, {p.addressCity}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Month</label>
                  <Input
                    name="readingDate"
                    type="month"
                    required
                    defaultValue={new Date().toISOString().slice(0, 7)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Grid import (kWh)</label>
                  <Input name="gridImportKwh" type="number" step="0.1" min="0" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Solar generated (kWh)</label>
                  <Input name="solarGeneratedKwh" type="number" step="0.1" min="0" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Exported to grid (kWh)</label>
                  <Input name="gridExportKwh" type="number" step="0.1" min="0" placeholder="0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Grid price (per kWh)</label>
                  <Input name="gridPricePerKwh" type="number" step="0.01" min="0.01" placeholder="0.00" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Notes (optional)</label>
                <Input name="notes" placeholder="e.g. Cloudy month, panel cleaning..." />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Reading'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Readings list */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : !readings?.length ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Sun className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No readings for {selectedYear}</h3>
            <p className="text-muted-foreground text-sm">Add monthly meter readings to track solar vs grid usage</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {readings.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">{r.readingDate}</div>
                    {r.notes && <p className="text-sm text-muted-foreground mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-sm flex-1">
                    <div>
                      <span className="text-muted-foreground text-xs">Solar</span>
                      <div className="font-medium flex items-center gap-1">
                        <Sun className="h-3 w-3 text-amber-500" />
                        {r.solarGeneratedKwh} kWh
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Grid import</span>
                      <div className="font-medium flex items-center gap-1">
                        <PlugZap className="h-3 w-3 text-blue-500" />
                        {r.gridImportKwh} kWh
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Solar savings</span>
                      <div className="font-medium text-green-600">{formatCurrency(r.solarSavings)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Grid cost</span>
                      <div className="font-medium">{formatCurrency(r.gridCost)}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(r.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
