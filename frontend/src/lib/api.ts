const API_BASE = '/api'

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Properties
  getProperties: () => request<Property[]>('/properties'),
  getProperty: (id: string) => request<Property>(`/properties/${id}`),
  createProperty: (data: CreatePropertyData) =>
    request<Property>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id: string, data: Partial<CreatePropertyData>) =>
    request<Property>(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProperty: (id: string) =>
    request(`/properties/${id}`, { method: 'DELETE' }),

  // Units
  getUnits: (propertyId?: string) =>
    request<Unit[]>(`/units${propertyId ? `?propertyId=${propertyId}` : ''}`),
  getUnit: (id: string) => request<Unit>(`/units/${id}`),
  createUnit: (data: CreateUnitData) =>
    request<Unit>('/units', { method: 'POST', body: JSON.stringify(data) }),
  updateUnit: (id: string, data: Partial<CreateUnitData>) =>
    request<Unit>(`/units/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Tenants
  getTenants: () => request<Tenant[]>('/tenants'),
  getTenant: (id: string) => request<Tenant>(`/tenants/${id}`),
  createTenant: (data: CreateTenantData) =>
    request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),

  // Leases
  getLeases: (unitId?: string) =>
    request<Lease[]>(`/leases${unitId ? `?unitId=${unitId}` : ''}`),
  createLease: (data: CreateLeaseData) =>
    request<Lease>('/leases', { method: 'POST', body: JSON.stringify(data) }),

  // Rent
  getRentStatus: (month?: string) =>
    request<RentStatusResponse>(`/rent/status${month ? `?month=${month}` : ''}`),
  getPayments: (leaseId?: string) =>
    request<Payment[]>(`/rent/payments${leaseId ? `?leaseId=${leaseId}` : ''}`),
  createPayment: (data: CreatePaymentData) =>
    request<Payment>('/rent/payments', { method: 'POST', body: JSON.stringify(data) }),

  // Expenses
  getExpenses: (propertyId?: string) =>
    request<Expense[]>(`/expenses${propertyId ? `?propertyId=${propertyId}` : ''}`),
  createExpense: (data: CreateExpenseData) =>
    request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Maintenance
  getMaintenanceTasks: (status?: string) =>
    request<MaintenanceTask[]>(`/maintenance${status ? `?status=${status}` : ''}`),
  getMaintenanceTemplates: () => request<MaintenanceTemplate[]>('/maintenance/templates'),
  getOverdueTasks: () => request<MaintenanceTask[]>('/maintenance/overdue'),
  getUpcomingTasks: () => request<MaintenanceTask[]>('/maintenance/upcoming'),
  createMaintenanceTask: (data: CreateMaintenanceData) =>
    request<MaintenanceTask>('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  completeTask: (id: string, data: CompleteTaskData) =>
    request(`/maintenance/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),

  // Energy
  getEnergyReadings: (propertyId?: string, year?: string) =>
    request<EnergyReading[]>(`/energy${propertyId ? `?propertyId=${propertyId}` : ''}${year ? `${propertyId ? '&' : '?'}year=${year}` : ''}`),
  createEnergyReading: (data: CreateEnergyReadingData) =>
    request<EnergyReading>('/energy', { method: 'POST', body: JSON.stringify(data) }),
  deleteEnergyReading: (id: string) =>
    request(`/energy/${id}`, { method: 'DELETE' }),

  // Reports
  getTaxReport: (year: number) => request<TaxReport>(`/reports/tax/${year}`),
  getCashFlow: (startDate: string, endDate: string) =>
    request<CashFlowReport>(`/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`),
}

// Types
export interface Property {
  id: string
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry: string
  propertyType: 'single_family' | 'multi_family' | 'condo' | 'townhouse'
  purchaseDate?: string
  purchasePrice?: number
  currentValue?: number
  notes?: string
  units?: Unit[]
}

export interface CreatePropertyData {
  addressStreet: string
  addressCity: string
  addressState: string
  addressZip: string
  addressCountry?: string
  propertyType: string
  purchaseDate?: string
  purchasePrice?: number
  currentValue?: number
  notes?: string
}

export interface Unit {
  id: string
  propertyId: string
  name: string
  bedrooms: number
  bathrooms: number
  squareFeet?: number
  monthlyRent: number
  securityDeposit?: number
  status: 'occupied' | 'vacant' | 'maintenance'
}

export interface CreateUnitData {
  propertyId: string
  name: string
  bedrooms?: number
  bathrooms?: number
  squareFeet?: number
  monthlyRent: number
  securityDeposit?: number
  status?: string
}

export interface Tenant {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone: string
  notes?: string
}

export interface CreateTenantData {
  firstName: string
  lastName: string
  email?: string
  phone: string
  notes?: string
}

export interface Lease {
  id: string
  unitId: string
  startDate: string
  endDate: string
  monthlyRent: number
  securityDeposit: number
  rentDueDay: number
  status: 'active' | 'expired' | 'terminated'
  tenants?: Tenant[]
}

export interface CreateLeaseData {
  unitId: string
  tenantIds: string[]
  primaryTenantId: string
  startDate: string
  endDate: string
  monthlyRent: number
  securityDeposit: number
  rentDueDay?: number
}

export interface Payment {
  id: string
  leaseId: string
  amount: number
  lateFeeAmount: number
  paymentDate: string
  periodStart: string
  periodEnd: string
  method: string
}

export interface CreatePaymentData {
  leaseId: string
  amount: number
  lateFeeAmount?: number
  paymentDate: string
  periodStart: string
  periodEnd: string
  method: string
  checkNumber?: string
  notes?: string
}

export interface RentStatusResponse {
  period: { start: string; end: string }
  summary: {
    totalExpected: number
    totalReceived: number
    totalOutstanding: number
    paidCount: number
    partialCount: number
    overdueCount: number
  }
  units: UnitRentStatus[]
}

export interface UnitRentStatus {
  leaseId: string
  property: { id: string; address: string }
  unit: { id: string; name: string }
  tenants: { id: string; name: string }[]
  amountDue: number
  totalPaid: number
  balance: number
  status: 'paid' | 'partial' | 'unpaid' | 'overdue'
  dueDate: string
  daysOverdue: number
  payments: { id: string; amount: number; lateFee: number; date: string; method: string }[]
}

export interface Expense {
  id: string
  propertyId?: string
  amount: number
  date: string
  category: string
  vendor?: string
  description?: string
}

export interface CreateExpenseData {
  propertyId?: string
  unitId?: string
  amount: number
  date: string
  category: string
  vendor?: string
  description?: string
}

export interface MaintenanceTask {
  id: string
  propertyId?: string
  name: string
  description?: string
  category: string
  frequency: string
  dueDate: string
  status: 'pending' | 'overdue' | 'completed' | 'skipped'
  estimatedCost?: number
  requiredByLaw: boolean
}

export interface MaintenanceTemplate {
  id: string
  name: string
  frequency: string
  description: string
  category: string
  estimatedCost: number
  requiredByLaw: boolean
}

export interface CreateMaintenanceData {
  propertyId?: string
  unitId?: string
  name: string
  description?: string
  category: string
  frequency: string
  dueDate: string
}

export interface CompleteTaskData {
  completedNotes?: string
  actualCost?: number
  vendor?: string
  createExpense?: boolean
}

export interface TaxReport {
  year: number
  properties: {
    propertyId: string
    address: string
    income: { rentsReceived: number; totalIncome: number }
    expenses: Record<string, number>
    netIncome: number
  }[]
  totals: {
    totalRents: number
    totalExpenses: number
    netIncome: number
    byCategory?: Record<string, number>
  }
}

export interface EnergyReading {
  id: string
  propertyId: string
  readingDate: string
  gridImportKwh: number
  solarGeneratedKwh: number
  gridExportKwh: number
  gridPricePerKwh: number
  notes?: string
  solarSavings: number
  gridCost: number
  exportEarnings: number
}

export interface CreateEnergyReadingData {
  propertyId: string
  readingDate: string
  gridImportKwh: number
  solarGeneratedKwh: number
  gridExportKwh: number
  gridPricePerKwh: number
  notes?: string
}

export interface CashFlowReport {
  startDate: string
  endDate: string
  income: number
  expenses: number
  netCashFlow: number
}
