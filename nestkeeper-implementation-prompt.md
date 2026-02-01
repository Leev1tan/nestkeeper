# NestKeeper Implementation Prompt

## System Instructions for AI Coding Assistant

You are building **NestKeeper**, a self-hosted property management tool for small landlords (1-10 units). This prompt contains everything you need to implement the system from scratch.

---

## Project Overview

### What We're Building
A full-stack web application with:
- React frontend (PWA-capable)
- Node.js/Fastify backend
- SQLite database
- Docker deployment

### Core User Stories
1. As a landlord, I want to **track rent payments** so I never lose track of who paid
2. As a landlord, I want to **log expenses with photos** so I'm ready for tax time
3. As a landlord, I want to **get maintenance reminders** so I never forget inspections
4. As a landlord, I want to **generate Schedule E reports** so tax prep is easy
5. As a landlord, I want to **store documents** so everything is in one place

### Design Principles
- **Mobile-first**: 80% of usage is on phones
- **< 3 clicks**: Any action should take max 3 taps
- **Offline-capable**: Works without internet, syncs later
- **Privacy-first**: No analytics, no tracking, all data local

---

## Tech Stack

```yaml
Frontend:
  - React 18 with TypeScript
  - Vite for bundling
  - TailwindCSS for styling
  - shadcn/ui for components
  - TanStack Query for data fetching
  - React Hook Form + Zod for forms
  - Workbox for PWA/service worker

Backend:
  - Node.js 20 LTS
  - Fastify framework
  - Drizzle ORM
  - SQLite database (better-sqlite3)
  - Zod for validation
  - node-cron for scheduled tasks

Deployment:
  - Docker + Docker Compose
  - Caddy for reverse proxy (optional)
```

---

## Database Schema

Implement this exact schema using Drizzle ORM:

```typescript
// backend/src/db/schema.ts

import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Helper for UUID generation
const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => text('created_at').default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () => text('updated_at').default(sql`CURRENT_TIMESTAMP`);

// ============ PROPERTIES ============
export const properties = sqliteTable('properties', {
  id: id(),
  addressStreet: text('address_street').notNull(),
  addressCity: text('address_city').notNull(),
  addressState: text('address_state').notNull(),
  addressZip: text('address_zip').notNull(),
  addressCountry: text('address_country').default('USA'),
  propertyType: text('property_type', { 
    enum: ['single_family', 'multi_family', 'condo', 'townhouse'] 
  }).notNull(),
  purchaseDate: text('purchase_date'), // ISO date
  purchasePrice: real('purchase_price'),
  currentValue: real('current_value'),
  notes: text('notes'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ============ UNITS ============
export const units = sqliteTable('units', {
  id: id(),
  propertyId: text('property_id').notNull().references(() => properties.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // "Unit A", "Main House", etc.
  bedrooms: integer('bedrooms').default(0),
  bathrooms: real('bathrooms').default(0),
  squareFeet: integer('square_feet'),
  monthlyRent: real('monthly_rent').notNull(),
  securityDeposit: real('security_deposit'),
  status: text('status', { enum: ['occupied', 'vacant', 'maintenance'] }).notNull().default('vacant'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

// ============ TENANTS ============
export const tenants = sqliteTable('tenants', {
  id: id(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactRelationship: text('emergency_contact_relationship'),
  notes: text('notes'),
  createdAt: createdAt(),
});

// ============ LEASES ============
export const leases = sqliteTable('leases', {
  id: id(),
  unitId: text('unit_id').notNull().references(() => units.id),
  startDate: text('start_date').notNull(), // ISO date
  endDate: text('end_date').notNull(),
  monthlyRent: real('monthly_rent').notNull(),
  securityDeposit: real('security_deposit').notNull(),
  rentDueDay: integer('rent_due_day').notNull().default(1),
  lateFeeAmount: real('late_fee_amount'),
  lateFeeGraceDays: integer('late_fee_grace_days').default(5),
  status: text('status', { enum: ['active', 'expired', 'terminated'] }).notNull().default('active'),
  renewalReminderDays: integer('renewal_reminder_days').default(60),
  createdAt: createdAt(),
});

// ============ LEASE-TENANT JUNCTION ============
export const leaseTenants = sqliteTable('lease_tenants', {
  leaseId: text('lease_id').notNull().references(() => leases.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
}, (table) => ({
  pk: { columns: [table.leaseId, table.tenantId] },
}));

// ============ RENT PAYMENTS ============
export const rentPayments = sqliteTable('rent_payments', {
  id: id(),
  leaseId: text('lease_id').notNull().references(() => leases.id),
  amount: real('amount').notNull(),
  lateFeeAmount: real('late_fee_amount').default(0),
  paymentDate: text('payment_date').notNull(), // ISO date
  periodStart: text('period_start').notNull(),
  periodEnd: text('period_end').notNull(),
  method: text('method', { 
    enum: ['cash', 'check', 'zelle', 'venmo', 'paypal', 'bank_transfer', 'other'] 
  }).notNull(),
  checkNumber: text('check_number'),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: createdAt(),
}, (table) => ({
  dateIdx: index('rent_payments_date_idx').on(table.paymentDate),
}));

// ============ EXPENSES ============
export const expenses = sqliteTable('expenses', {
  id: id(),
  propertyId: text('property_id').references(() => properties.id),
  unitId: text('unit_id').references(() => units.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(), // ISO date
  category: text('category', {
    enum: [
      'advertising', 'auto_travel', 'cleaning_maintenance', 'commissions',
      'insurance', 'legal_professional', 'management_fees', 'mortgage_interest',
      'other_interest', 'repairs', 'supplies', 'taxes', 'utilities', 'depreciation', 'other'
    ]
  }).notNull(),
  vendor: text('vendor'),
  description: text('description'),
  receiptPath: text('receipt_path'),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'credit_card', 'debit_card', 'check', 'bank_transfer']
  }),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringExpenseId: text('recurring_expense_id'),
  taxDeductible: integer('tax_deductible', { mode: 'boolean' }).default(true),
  createdAt: createdAt(),
}, (table) => ({
  dateIdx: index('expenses_date_idx').on(table.date),
  categoryIdx: index('expenses_category_idx').on(table.category),
  propertyIdx: index('expenses_property_idx').on(table.propertyId),
}));

// ============ RECURRING EXPENSES ============
export const recurringExpenses = sqliteTable('recurring_expenses', {
  id: id(),
  propertyId: text('property_id').references(() => properties.id),
  amount: real('amount').notNull(),
  category: text('category').notNull(),
  vendor: text('vendor'),
  description: text('description'),
  frequency: text('frequency', { enum: ['monthly', 'quarterly', 'annually'] }).notNull(),
  dayOfMonth: integer('day_of_month'),
  monthOfYear: integer('month_of_year'),
  autoCreate: integer('auto_create', { mode: 'boolean' }).default(true),
  nextDueDate: text('next_due_date').notNull(),
  createdAt: createdAt(),
});

// ============ MAINTENANCE TASKS ============
export const maintenanceTasks = sqliteTable('maintenance_tasks', {
  id: id(),
  propertyId: text('property_id').references(() => properties.id),
  unitId: text('unit_id').references(() => units.id),
  templateId: text('template_id'),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category', {
    enum: ['safety', 'hvac', 'plumbing', 'electrical', 'exterior', 'interior', 'pest_control', 'appliance', 'other']
  }).notNull(),
  frequency: text('frequency', {
    enum: ['one_time', 'monthly', 'quarterly', 'every_6_months', 'annually', 'custom']
  }).notNull(),
  customFrequencyDays: integer('custom_frequency_days'),
  dueDate: text('due_date').notNull(),
  reminderDays: text('reminder_days'), // JSON array like "[7, 3, 1, 0]"
  status: text('status', { enum: ['pending', 'overdue', 'completed', 'skipped'] }).notNull().default('pending'),
  completedDate: text('completed_date'),
  completedNotes: text('completed_notes'),
  linkedExpenseId: text('linked_expense_id').references(() => expenses.id),
  estimatedCost: real('estimated_cost'),
  actualCost: real('actual_cost'),
  vendor: text('vendor'),
  requiredByLaw: integer('required_by_law', { mode: 'boolean' }).default(false),
  createdAt: createdAt(),
}, (table) => ({
  dueIdx: index('maintenance_due_idx').on(table.dueDate),
  statusIdx: index('maintenance_status_idx').on(table.status),
}));

// ============ DOCUMENTS ============
export const documents = sqliteTable('documents', {
  id: id(),
  name: text('name').notNull(),
  type: text('type', {
    enum: ['lease', 'insurance', 'deed', 'inspection', 'receipt', 'photo', 'correspondence', 'tax', 'other']
  }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  propertyId: text('property_id').references(() => properties.id),
  unitId: text('unit_id').references(() => units.id),
  tenantId: text('tenant_id').references(() => tenants.id),
  expenseId: text('expense_id').references(() => expenses.id),
  tags: text('tags'), // JSON array
  expirationDate: text('expiration_date'),
  encrypted: integer('encrypted', { mode: 'boolean' }).default(false),
  uploadedAt: createdAt(),
});

// ============ APPLIANCES ============
export const appliances = sqliteTable('appliances', {
  id: id(),
  unitId: text('unit_id').notNull().references(() => units.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['refrigerator', 'stove', 'dishwasher', 'washer', 'dryer', 'hvac', 'water_heater', 'garbage_disposal', 'microwave', 'other']
  }).notNull(),
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  purchaseDate: text('purchase_date'),
  warrantyExpiration: text('warranty_expiration'),
  lastServiceDate: text('last_service_date'),
  notes: text('notes'),
  createdAt: createdAt(),
});

// ============ SETTINGS ============
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: updatedAt(),
});
```

---

## API Routes Implementation

### Properties Routes

```typescript
// backend/src/routes/properties.ts

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { properties, units } from '../db/schema';

const createPropertySchema = z.object({
  addressStreet: z.string().min(1),
  addressCity: z.string().min(1),
  addressState: z.string().length(2),
  addressZip: z.string().min(5),
  addressCountry: z.string().default('USA'),
  propertyType: z.enum(['single_family', 'multi_family', 'condo', 'townhouse']),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  currentValue: z.number().optional(),
  notes: z.string().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

export const propertiesRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/properties - List all properties
  fastify.get('/', async () => {
    const allProperties = await db.select().from(properties);
    
    // Get unit counts for each property
    const propertiesWithUnits = await Promise.all(
      allProperties.map(async (property) => {
        const propertyUnits = await db
          .select()
          .from(units)
          .where(eq(units.propertyId, property.id));
        
        return {
          ...property,
          unitCount: propertyUnits.length,
          occupiedCount: propertyUnits.filter(u => u.status === 'occupied').length,
        };
      })
    );
    
    return propertiesWithUnits;
  });

  // POST /api/properties - Create property
  fastify.post('/', async (request, reply) => {
    const body = createPropertySchema.parse(request.body);
    
    const [newProperty] = await db
      .insert(properties)
      .values(body)
      .returning();
    
    // For single_family, auto-create one unit
    if (body.propertyType === 'single_family') {
      await db.insert(units).values({
        propertyId: newProperty.id,
        name: 'Main House',
        monthlyRent: 0,
        status: 'vacant',
      });
    }
    
    return reply.code(201).send(newProperty);
  });

  // GET /api/properties/:id - Get property details
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id));
    
    if (!property) {
      return reply.code(404).send({ error: 'Property not found' });
    }
    
    const propertyUnits = await db
      .select()
      .from(units)
      .where(eq(units.propertyId, id));
    
    return { ...property, units: propertyUnits };
  });

  // PUT /api/properties/:id - Update property
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = updatePropertySchema.parse(request.body);
    
    const [updated] = await db
      .update(properties)
      .set({ ...body, updatedAt: new Date().toISOString() })
      .where(eq(properties.id, id))
      .returning();
    
    if (!updated) {
      return reply.code(404).send({ error: 'Property not found' });
    }
    
    return updated;
  });

  // DELETE /api/properties/:id - Delete property
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const [deleted] = await db
      .delete(properties)
      .where(eq(properties.id, id))
      .returning();
    
    if (!deleted) {
      return reply.code(404).send({ error: 'Property not found' });
    }
    
    return { success: true };
  });
};
```

### Rent Routes

```typescript
// backend/src/routes/rent.ts

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db } from '../db';
import { rentPayments, leases, units, properties, tenants, leaseTenants } from '../db/schema';

const createPaymentSchema = z.object({
  leaseId: z.string().uuid(),
  amount: z.number().positive(),
  lateFeeAmount: z.number().optional().default(0),
  paymentDate: z.string(), // ISO date
  periodStart: z.string(),
  periodEnd: z.string(),
  method: z.enum(['cash', 'check', 'zelle', 'venmo', 'paypal', 'bank_transfer', 'other']),
  checkNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const rentRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/rent/status - Get current rent status for all units
  fastify.get('/status', async (request) => {
    const { month } = request.query as { month?: string };
    
    // Default to current month
    const targetDate = month ? new Date(month) : new Date();
    const year = targetDate.getFullYear();
    const monthNum = targetDate.getMonth();
    
    const periodStart = new Date(year, monthNum, 1).toISOString().split('T')[0];
    const periodEnd = new Date(year, monthNum + 1, 0).toISOString().split('T')[0];
    
    // Get all active leases with their units and properties
    const activeLeases = await db
      .select({
        lease: leases,
        unit: units,
        property: properties,
      })
      .from(leases)
      .innerJoin(units, eq(leases.unitId, units.id))
      .innerJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(leases.status, 'active'));
    
    // Build rent status for each lease
    const rentStatus = await Promise.all(
      activeLeases.map(async ({ lease, unit, property }) => {
        // Get payments for this period
        const payments = await db
          .select()
          .from(rentPayments)
          .where(
            and(
              eq(rentPayments.leaseId, lease.id),
              gte(rentPayments.periodStart, periodStart),
              lte(rentPayments.periodEnd, periodEnd)
            )
          );
        
        // Get tenant info
        const leaseTenantsData = await db
          .select({ tenant: tenants })
          .from(leaseTenants)
          .innerJoin(tenants, eq(leaseTenants.tenantId, tenants.id))
          .where(eq(leaseTenants.leaseId, lease.id));
        
        const totalPaid = payments.reduce((sum, p) => sum + p.amount + (p.lateFeeAmount || 0), 0);
        const amountDue = lease.monthlyRent;
        
        // Determine status
        let status: 'paid' | 'partial' | 'unpaid' | 'overdue';
        const today = new Date();
        const dueDate = new Date(year, monthNum, lease.rentDueDay);
        
        if (totalPaid >= amountDue) {
          status = 'paid';
        } else if (totalPaid > 0) {
          status = 'partial';
        } else if (today > dueDate) {
          status = 'overdue';
        } else {
          status = 'unpaid';
        }
        
        const daysOverdue = status === 'overdue' 
          ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        return {
          leaseId: lease.id,
          property: {
            id: property.id,
            address: `${property.addressStreet}, ${property.addressCity}`,
          },
          unit: {
            id: unit.id,
            name: unit.name,
          },
          tenants: leaseTenantsData.map(t => ({
            id: t.tenant.id,
            name: `${t.tenant.firstName} ${t.tenant.lastName}`,
          })),
          amountDue,
          totalPaid,
          balance: amountDue - totalPaid,
          status,
          dueDate: dueDate.toISOString().split('T')[0],
          daysOverdue,
          payments: payments.map(p => ({
            id: p.id,
            amount: p.amount,
            lateFee: p.lateFeeAmount,
            date: p.paymentDate,
            method: p.method,
          })),
        };
      })
    );
    
    // Calculate summary
    const summary = {
      totalExpected: rentStatus.reduce((sum, r) => sum + r.amountDue, 0),
      totalReceived: rentStatus.reduce((sum, r) => sum + r.totalPaid, 0),
      totalOutstanding: rentStatus.reduce((sum, r) => sum + r.balance, 0),
      paidCount: rentStatus.filter(r => r.status === 'paid').length,
      partialCount: rentStatus.filter(r => r.status === 'partial').length,
      overdueCount: rentStatus.filter(r => r.status === 'overdue').length,
    };
    
    return {
      period: { start: periodStart, end: periodEnd },
      summary,
      units: rentStatus,
    };
  });

  // POST /api/rent/payments - Log a rent payment
  fastify.post('/payments', async (request, reply) => {
    const body = createPaymentSchema.parse(request.body);
    
    // Verify lease exists
    const [lease] = await db
      .select()
      .from(leases)
      .where(eq(leases.id, body.leaseId));
    
    if (!lease) {
      return reply.code(404).send({ error: 'Lease not found' });
    }
    
    const [payment] = await db
      .insert(rentPayments)
      .values(body)
      .returning();
    
    return reply.code(201).send(payment);
  });

  // GET /api/rent/payments - List payments with filters
  fastify.get('/payments', async (request) => {
    const { leaseId, startDate, endDate, limit = 50 } = request.query as {
      leaseId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    };
    
    let query = db.select().from(rentPayments);
    
    const conditions = [];
    if (leaseId) conditions.push(eq(rentPayments.leaseId, leaseId));
    if (startDate) conditions.push(gte(rentPayments.paymentDate, startDate));
    if (endDate) conditions.push(lte(rentPayments.paymentDate, endDate));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const payments = await query
      .orderBy(desc(rentPayments.paymentDate))
      .limit(limit);
    
    return payments;
  });

  // DELETE /api/rent/payments/:id - Delete payment
  fastify.delete('/payments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const [deleted] = await db
      .delete(rentPayments)
      .where(eq(rentPayments.id, id))
      .returning();
    
    if (!deleted) {
      return reply.code(404).send({ error: 'Payment not found' });
    }
    
    return { success: true };
  });
};
```

### Maintenance Routes

```typescript
// backend/src/routes/maintenance.ts

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, and, lte, gte, or, desc } from 'drizzle-orm';
import { db } from '../db';
import { maintenanceTasks, properties, units, expenses } from '../db/schema';

const MAINTENANCE_TEMPLATES = [
  {
    id: 'smoke-detector',
    name: 'Smoke/CO Detector Check',
    frequency: 'every_6_months',
    description: 'Test all smoke and CO detectors, replace batteries',
    category: 'safety',
    estimatedCost: 20,
    requiredByLaw: true,
    reminderDays: '[7, 3, 1, 0, -3, -7]',
  },
  {
    id: 'hvac-filter',
    name: 'HVAC Filter Change',
    frequency: 'quarterly',
    description: 'Replace HVAC air filters',
    category: 'hvac',
    estimatedCost: 30,
    requiredByLaw: false,
    reminderDays: '[7, 1, 0]',
  },
  {
    id: 'hvac-service',
    name: 'HVAC Professional Service',
    frequency: 'annually',
    description: 'Annual HVAC inspection and tune-up',
    category: 'hvac',
    estimatedCost: 150,
    requiredByLaw: false,
    reminderDays: '[14, 7, 1, 0]',
  },
  {
    id: 'pest-control',
    name: 'Pest Control Treatment',
    frequency: 'quarterly',
    description: 'Professional pest control treatment',
    category: 'pest_control',
    estimatedCost: 100,
    requiredByLaw: false,
    reminderDays: '[7, 1, 0]',
  },
  {
    id: 'gutter-cleaning',
    name: 'Gutter Cleaning',
    frequency: 'every_6_months',
    description: 'Clean gutters and downspouts',
    category: 'exterior',
    estimatedCost: 150,
    requiredByLaw: false,
    reminderDays: '[14, 7, 0]',
  },
  {
    id: 'water-heater-flush',
    name: 'Water Heater Flush',
    frequency: 'annually',
    description: 'Drain and flush water heater to remove sediment',
    category: 'plumbing',
    estimatedCost: 0,
    requiredByLaw: false,
    reminderDays: '[14, 7, 0]',
  },
  {
    id: 'dryer-vent',
    name: 'Dryer Vent Cleaning',
    frequency: 'annually',
    description: 'Clean dryer vent to prevent fire hazard',
    category: 'safety',
    estimatedCost: 100,
    requiredByLaw: true,
    reminderDays: '[14, 7, 1, 0, -7]',
  },
  {
    id: 'fire-extinguisher',
    name: 'Fire Extinguisher Check',
    frequency: 'annually',
    description: 'Inspect fire extinguisher, replace if needed',
    category: 'safety',
    estimatedCost: 50,
    requiredByLaw: true,
    reminderDays: '[30, 14, 7, 0]',
  },
];

const createTaskSchema = z.object({
  propertyId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  templateId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['safety', 'hvac', 'plumbing', 'electrical', 'exterior', 'interior', 'pest_control', 'appliance', 'other']),
  frequency: z.enum(['one_time', 'monthly', 'quarterly', 'every_6_months', 'annually', 'custom']),
  customFrequencyDays: z.number().optional(),
  dueDate: z.string(),
  reminderDays: z.string().optional().default('[7, 1, 0]'),
  estimatedCost: z.number().optional(),
  vendor: z.string().optional(),
  requiredByLaw: z.boolean().optional().default(false),
});

const completeTaskSchema = z.object({
  completedNotes: z.string().optional(),
  actualCost: z.number().optional(),
  vendor: z.string().optional(),
  createExpense: z.boolean().optional().default(false),
});

export const maintenanceRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/maintenance/templates - Get maintenance templates
  fastify.get('/templates', async () => {
    return MAINTENANCE_TEMPLATES;
  });

  // GET /api/maintenance - List all tasks with status
  fastify.get('/', async (request) => {
    const { status, propertyId } = request.query as { status?: string; propertyId?: string };
    
    const today = new Date().toISOString().split('T')[0];
    
    // First, update overdue statuses
    await db
      .update(maintenanceTasks)
      .set({ status: 'overdue' })
      .where(
        and(
          eq(maintenanceTasks.status, 'pending'),
          lte(maintenanceTasks.dueDate, today)
        )
      );
    
    // Build query
    let query = db
      .select({
        task: maintenanceTasks,
        property: properties,
        unit: units,
      })
      .from(maintenanceTasks)
      .leftJoin(properties, eq(maintenanceTasks.propertyId, properties.id))
      .leftJoin(units, eq(maintenanceTasks.unitId, units.id));
    
    const conditions = [];
    if (status) conditions.push(eq(maintenanceTasks.status, status as any));
    if (propertyId) conditions.push(eq(maintenanceTasks.propertyId, propertyId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const results = await query.orderBy(maintenanceTasks.dueDate);
    
    return results.map(({ task, property, unit }) => ({
      ...task,
      property: property ? {
        id: property.id,
        address: `${property.addressStreet}, ${property.addressCity}`,
      } : null,
      unit: unit ? { id: unit.id, name: unit.name } : null,
    }));
  });

  // GET /api/maintenance/overdue - Get overdue tasks
  fastify.get('/overdue', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const tasks = await db
      .select({
        task: maintenanceTasks,
        property: properties,
        unit: units,
      })
      .from(maintenanceTasks)
      .leftJoin(properties, eq(maintenanceTasks.propertyId, properties.id))
      .leftJoin(units, eq(maintenanceTasks.unitId, units.id))
      .where(
        or(
          eq(maintenanceTasks.status, 'overdue'),
          and(
            eq(maintenanceTasks.status, 'pending'),
            lte(maintenanceTasks.dueDate, today)
          )
        )
      )
      .orderBy(maintenanceTasks.dueDate);
    
    return tasks.map(({ task, property, unit }) => ({
      ...task,
      daysOverdue: Math.floor(
        (new Date().getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
      property: property ? {
        id: property.id,
        address: `${property.addressStreet}, ${property.addressCity}`,
      } : null,
      unit: unit ? { id: unit.id, name: unit.name } : null,
    }));
  });

  // GET /api/maintenance/upcoming - Get upcoming tasks (next 30 days)
  fastify.get('/upcoming', async () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const tasks = await db
      .select({
        task: maintenanceTasks,
        property: properties,
        unit: units,
      })
      .from(maintenanceTasks)
      .leftJoin(properties, eq(maintenanceTasks.propertyId, properties.id))
      .leftJoin(units, eq(maintenanceTasks.unitId, units.id))
      .where(
        and(
          eq(maintenanceTasks.status, 'pending'),
          gte(maintenanceTasks.dueDate, today.toISOString().split('T')[0]),
          lte(maintenanceTasks.dueDate, thirtyDaysLater.toISOString().split('T')[0])
        )
      )
      .orderBy(maintenanceTasks.dueDate);
    
    return tasks.map(({ task, property, unit }) => ({
      ...task,
      daysUntilDue: Math.floor(
        (new Date(task.dueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
      property: property ? {
        id: property.id,
        address: `${property.addressStreet}, ${property.addressCity}`,
      } : null,
      unit: unit ? { id: unit.id, name: unit.name } : null,
    }));
  });

  // POST /api/maintenance - Create task
  fastify.post('/', async (request, reply) => {
    const body = createTaskSchema.parse(request.body);
    
    const [task] = await db
      .insert(maintenanceTasks)
      .values(body)
      .returning();
    
    return reply.code(201).send(task);
  });

  // POST /api/maintenance/from-template - Create task from template
  fastify.post('/from-template', async (request, reply) => {
    const { templateId, propertyId, unitId, dueDate } = request.body as {
      templateId: string;
      propertyId?: string;
      unitId?: string;
      dueDate: string;
    };
    
    const template = MAINTENANCE_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return reply.code(404).send({ error: 'Template not found' });
    }
    
    const [task] = await db
      .insert(maintenanceTasks)
      .values({
        templateId: template.id,
        propertyId,
        unitId,
        name: template.name,
        description: template.description,
        category: template.category as any,
        frequency: template.frequency as any,
        dueDate,
        reminderDays: template.reminderDays,
        estimatedCost: template.estimatedCost,
        requiredByLaw: template.requiredByLaw,
      })
      .returning();
    
    return reply.code(201).send(task);
  });

  // POST /api/maintenance/:id/complete - Mark task complete
  fastify.post('/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = completeTaskSchema.parse(request.body);
    
    const [task] = await db
      .select()
      .from(maintenanceTasks)
      .where(eq(maintenanceTasks.id, id));
    
    if (!task) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    
    const completedDate = new Date().toISOString().split('T')[0];
    
    // Update the task
    const [updatedTask] = await db
      .update(maintenanceTasks)
      .set({
        status: 'completed',
        completedDate,
        completedNotes: body.completedNotes,
        actualCost: body.actualCost,
        vendor: body.vendor,
      })
      .where(eq(maintenanceTasks.id, id))
      .returning();
    
    // Optionally create an expense
    let expense = null;
    if (body.createExpense && body.actualCost && body.actualCost > 0) {
      [expense] = await db
        .insert(expenses)
        .values({
          propertyId: task.propertyId,
          unitId: task.unitId,
          amount: body.actualCost,
          date: completedDate,
          category: 'repairs',
          vendor: body.vendor,
          description: `Maintenance: ${task.name}`,
          taxDeductible: true,
        })
        .returning();
      
      // Link expense to task
      await db
        .update(maintenanceTasks)
        .set({ linkedExpenseId: expense.id })
        .where(eq(maintenanceTasks.id, id));
    }
    
    // If recurring, create next task
    if (task.frequency !== 'one_time') {
      const nextDueDate = calculateNextDueDate(completedDate, task.frequency, task.customFrequencyDays);
      
      await db.insert(maintenanceTasks).values({
        propertyId: task.propertyId,
        unitId: task.unitId,
        templateId: task.templateId,
        name: task.name,
        description: task.description,
        category: task.category,
        frequency: task.frequency,
        customFrequencyDays: task.customFrequencyDays,
        dueDate: nextDueDate,
        reminderDays: task.reminderDays,
        estimatedCost: task.estimatedCost,
        vendor: task.vendor,
        requiredByLaw: task.requiredByLaw,
      });
    }
    
    return { task: updatedTask, expense, nextTaskCreated: task.frequency !== 'one_time' };
  });

  // DELETE /api/maintenance/:id - Delete task
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const [deleted] = await db
      .delete(maintenanceTasks)
      .where(eq(maintenanceTasks.id, id))
      .returning();
    
    if (!deleted) {
      return reply.code(404).send({ error: 'Task not found' });
    }
    
    return { success: true };
  });
};

// Helper function to calculate next due date
function calculateNextDueDate(
  fromDate: string,
  frequency: string,
  customDays?: number | null
): string {
  const date = new Date(fromDate);
  
  switch (frequency) {
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'every_6_months':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'custom':
      if (customDays) {
        date.setDate(date.getDate() + customDays);
      }
      break;
  }
  
  return date.toISOString().split('T')[0];
}
```

---

## Frontend Components

### Main App Structure

```tsx
// frontend/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Properties } from './pages/Properties';
import { PropertyDetail } from './pages/PropertyDetail';
import { RentDashboard } from './pages/RentDashboard';
import { Expenses } from './pages/Expenses';
import { Maintenance } from './pages/Maintenance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetail />} />
            <Route path="/rent" element={<RentDashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

### Mobile Navigation

```tsx
// frontend/src/components/layout/MobileNav.tsx

import { Link, useLocation } from 'react-router-dom';
import { Home, Building, DollarSign, Wrench, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/properties', icon: Building, label: 'Properties' },
  { href: '/rent', icon: DollarSign, label: 'Rent' },
  { href: '/maintenance', icon: Wrench, label: 'Tasks' },
  { href: '/expenses', icon: FileText, label: 'Expenses' },
];

export function MobileNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location.pathname === href || 
            (href !== '/' && location.pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full',
                'text-xs transition-colors',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-1', isActive && 'stroke-[2.5]')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Quick Payment Form (Mobile Optimized)

```tsx
// frontend/src/components/rent/QuickPaymentForm.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const paymentSchema = z.object({
  leaseId: z.string().min(1, 'Select a unit'),
  amount: z.number().positive('Amount must be positive'),
  lateFeeAmount: z.number().min(0).optional(),
  paymentDate: z.string(),
  method: z.enum(['cash', 'check', 'zelle', 'venmo', 'paypal', 'bank_transfer', 'other']),
  checkNumber: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface QuickPaymentFormProps {
  leases: Array<{
    id: string;
    propertyAddress: string;
    unitName: string;
    monthlyRent: number;
  }>;
  defaultLeaseId?: string;
  trigger?: React.ReactNode;
}

export function QuickPaymentForm({ leases, defaultLeaseId, trigger }: QuickPaymentFormProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');
  
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      leaseId: defaultLeaseId || '',
      amount: 0,
      lateFeeAmount: 0,
      paymentDate: today,
      method: 'zelle',
      checkNumber: '',
      notes: '',
    },
  });
  
  const selectedLease = leases.find(l => l.id === form.watch('leaseId'));
  
  const mutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const periodStart = `${currentMonth}-01`;
      const periodEnd = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd');
      
      return api.post('/rent/payments', {
        ...data,
        periodStart,
        periodEnd,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Payment recorded',
        description: 'The rent payment has been logged successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['rent-status'] });
      setOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: PaymentFormData) => {
    mutation.mutate(data);
  };
  
  // Auto-fill amount when lease is selected
  const handleLeaseChange = (leaseId: string) => {
    form.setValue('leaseId', leaseId);
    const lease = leases.find(l => l.id === leaseId);
    if (lease) {
      form.setValue('amount', lease.monthlyRent);
    }
  };
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="lg" className="w-full">
            💰 Log Rent Payment
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Rent Payment</SheetTitle>
        </SheetHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Unit Selection */}
          <div className="space-y-2">
            <Label>Property / Unit</Label>
            <Select
              value={form.watch('leaseId')}
              onValueChange={handleLeaseChange}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {leases.map((lease) => (
                  <SelectItem key={lease.id} value={lease.id}>
                    <div className="flex flex-col">
                      <span>{lease.propertyAddress}</span>
                      <span className="text-sm text-gray-500">
                        {lease.unitName} - ${lease.monthlyRent}/mo
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.leaseId && (
              <p className="text-sm text-red-500">{form.formState.errors.leaseId.message}</p>
            )}
          </div>
          
          {/* Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-7 h-12 text-lg"
                  {...form.register('amount', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Late Fee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  className="pl-7 h-12"
                  {...form.register('lateFeeAmount', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input
              type="date"
              className="h-12"
              {...form.register('paymentDate')}
            />
          </div>
          
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'cash', label: '💵 Cash' },
                { value: 'check', label: '📝 Check' },
                { value: 'zelle', label: '⚡ Zelle' },
                { value: 'venmo', label: '📱 Venmo' },
              ].map(({ value, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={form.watch('method') === value ? 'default' : 'outline'}
                  className="h-12"
                  onClick={() => form.setValue('method', value as any)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Check Number (conditional) */}
          {form.watch('method') === 'check' && (
            <div className="space-y-2">
              <Label>Check Number</Label>
              <Input
                className="h-12"
                placeholder="Optional"
                {...form.register('checkNumber')}
              />
            </div>
          )}
          
          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Any additional notes..."
              {...form.register('notes')}
            />
          </div>
          
          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : '💾 Save Payment'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Docker Configuration

```dockerfile
# Dockerfile

# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built assets
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/nestkeeper.db
ENV UPLOAD_PATH=/app/data/documents
ENV BACKUP_PATH=/app/data/backups
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml

version: '3.8'

services:
  nestkeeper:
    build: .
    container_name: nestkeeper
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/nestkeeper.db
      - UPLOAD_PATH=/app/data/documents
      - BACKUP_PATH=/app/data/backups
      - JWT_SECRET=${JWT_SECRET:-change-me-in-production}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Caddy for automatic HTTPS
  caddy:
    image: caddy:2-alpine
    container_name: nestkeeper-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - nestkeeper
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

```
# Caddyfile

{$DOMAIN:localhost} {
    reverse_proxy nestkeeper:3000
}
```

---

## Implementation Order

### Week 1-2: Foundation
1. Set up monorepo structure
2. Configure Vite + React + TailwindCSS
3. Configure Fastify + Drizzle
4. Implement database schema and migrations
5. Create basic API routes (CRUD for properties, units)

### Week 3-4: Core Features
1. Tenant and lease management
2. Rent payment tracking with status dashboard
3. Mobile-responsive UI components
4. Basic expense logging

### Week 5-6: Differentiators
1. Maintenance task scheduler with templates
2. Recurring task creation
3. Push/in-app notifications
4. Receipt image upload

### Week 7-8: Polish
1. Tax report generation (Schedule E PDF)
2. PWA setup with offline support
3. Backup/restore functionality
4. Docker deployment and documentation

---

## Testing Strategy

```typescript
// Example test for rent status calculation
describe('Rent Status', () => {
  it('should mark rent as overdue after grace period', async () => {
    // Create a lease due on the 1st with 5 day grace
    const lease = await createLease({
      rentDueDay: 1,
      lateFeeGraceDays: 5,
      monthlyRent: 1000,
    });
    
    // Set current date to the 10th (9 days past due)
    jest.setSystemTime(new Date(2024, 0, 10));
    
    const status = await getRentStatus(lease.id, '2024-01');
    
    expect(status.status).toBe('overdue');
    expect(status.daysOverdue).toBe(9);
  });
  
  it('should calculate partial payment correctly', async () => {
    const lease = await createLease({ monthlyRent: 1000 });
    
    await logPayment({ leaseId: lease.id, amount: 600 });
    
    const status = await getRentStatus(lease.id, '2024-01');
    
    expect(status.status).toBe('partial');
    expect(status.totalPaid).toBe(600);
    expect(status.balance).toBe(400);
  });
});
```

---

## Success Criteria

Before launching, verify:

- [ ] Can add property and units in < 30 seconds
- [ ] Can log rent payment in < 5 seconds on mobile
- [ ] Can add expense with receipt photo in < 10 seconds
- [ ] Maintenance reminders fire correctly
- [ ] Tax report generates accurate Schedule E data
- [ ] App works offline (view data, queue changes)
- [ ] Docker deployment works with single command
- [ ] Data backup/restore works correctly
- [ ] Mobile UI is thumb-friendly (large touch targets)
- [ ] Performance: < 100ms API responses, < 3s initial load
