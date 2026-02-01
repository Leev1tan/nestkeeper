import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wrench, Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { api, type CreateMaintenanceData, type Property } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'

export function Maintenance() {
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all')
  const queryClient = useQueryClient()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['maintenanceTasks', filter],
    queryFn: () => api.getMaintenanceTasks(filter === 'all' ? undefined : filter),
  })

  const { data: templates } = useQuery({
    queryKey: ['maintenanceTemplates'],
    queryFn: api.getMaintenanceTemplates,
  })

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  })

  const createMutation = useMutation({
    mutationFn: api.createMaintenanceTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] })
      setShowForm(false)
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { createExpense: boolean } }) =>
      api.completeTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceTasks'] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const templateId = formData.get('templateId') as string
    const template = templates?.find(t => t.id === templateId)

    const data: CreateMaintenanceData = {
      propertyId: formData.get('propertyId') as string || undefined,
      name: template?.name || formData.get('name') as string,
      description: template?.description,
      category: template?.category || 'other',
      frequency: template?.frequency || 'one_time',
      dueDate: formData.get('dueDate') as string,
    }
    createMutation.mutate(data)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-amber-600" />
    }
  }

  const overdueCount = tasks?.filter(t => t.status === 'overdue').length ?? 0
  const pendingCount = tasks?.filter(t => t.status === 'pending').length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">
            {overdueCount > 0 && <span className="text-red-600">{overdueCount} overdue</span>}
            {overdueCount > 0 && pendingCount > 0 && ' • '}
            {pendingCount > 0 && <span>{pendingCount} pending</span>}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'pending', 'overdue', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Maintenance Task</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template (optional)</label>
                <Select name="templateId">
                  <option value="">Custom task</option>
                  {templates?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.frequency.replace('_', ' ')})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Property (optional)</label>
                <Select name="propertyId">
                  <option value="">All properties</option>
                  {properties?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.addressStreet}, {p.addressCity}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Add Task'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : tasks?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No maintenance tasks</h3>
            <p className="text-muted-foreground">
              Add tasks to track property maintenance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks?.map((task) => (
            <Card
              key={task.id}
              className={task.status === 'overdue' ? 'border-red-200 bg-red-50' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.name}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="capitalize">{task.category.replace('_', ' ')}</span>
                        <span>•</span>
                        <span>Due: {formatDate(task.dueDate)}</span>
                        {task.estimatedCost && (
                          <>
                            <span>•</span>
                            <span>Est: {formatCurrency(task.estimatedCost)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.requiredByLaw && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full capitalize">
                      {task.frequency.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {task.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => completeMutation.mutate({ id: task.id, data: { createExpense: false } })}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Complete
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
