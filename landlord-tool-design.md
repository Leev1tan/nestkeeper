# NestKeeper: Self-Hosted Property Management for Small Landlords

## Complete Product Design & Technical Architecture

---

## Executive Summary

**NestKeeper** is a self-hosted, privacy-first property management tool designed specifically for small landlords (1-10 units). Unlike bloated enterprise solutions or cloud-only SaaS with recurring fees, NestKeeper focuses on the core pain points: **never forgetting maintenance, tracking rent effortlessly, and having tax-ready records**.

### Why This Product Will Win

| Pain Point (from Reddit research) | How NestKeeper Solves It |
|-----------------------------------|--------------------------|
| "I use spreadsheets but forget to update them" | Auto-reminders, mobile-first entry |
| "Enterprise software is too complex for 3 units" | Opinionated simplicity, no feature bloat |
| "I missed $500 in tax deductions last year" | Automatic expense categorization for Schedule E |
| "I forgot the HVAC inspection was due" | Smart recurring maintenance scheduler |
| "I don't want my tenant data in someone's cloud" | 100% self-hosted, your data stays yours |
| "Free tools have hidden fees or limited features" | One-time purchase or truly free open-core |

---

## Target User Persona

### Primary: "Mike the Side-Hustle Landlord"

- **Demographics**: 35-55 years old, owns 1-5 rental units
- **Tech Savvy**: Moderate - uses smartphone daily, can follow a Docker tutorial
- **Current Tools**: Google Sheets, paper files, text messages to tenants
- **Pain Points**:
  - Forgets maintenance inspections (HVAC, smoke detectors, pest control)
  - Chases rent payments manually
  - Scrambles at tax time to find receipts
  - Worried about tenant data in cloud services
- **Willingness to Pay**: $10-25/month OR $150-300 one-time

### Secondary: "Sarah the Accidental Landlord"

- Inherited property or moved and kept old house as rental
- 1-2 units, very part-time involvement
- Needs something even simpler than spreadsheets
- Will pay for "set it and forget it" reliability

---

## Core Product Principles

### 1. **Ruthless Simplicity**
- Every feature must pass the "Would Mike use this weekly?" test
- No feature creep - say NO to advanced analytics, AI predictions, etc.
- Maximum 3 clicks to accomplish any task

### 2. **Mobile-First, Desktop-Capable**
- 80% of usage will be on phone (logging expenses on-the-go)
- PWA (Progressive Web App) for native-like mobile experience
- Responsive desktop view for tax-time reporting

### 3. **Privacy as a Feature**
- Self-hosted = landlord owns their data
- No analytics, tracking, or phone-home
- Encrypted backups, optional E2E encryption for sensitive fields

### 4. **Offline-Capable**
- Core features work without internet
- Sync when connection restored
- Critical for property visits in basement/rural areas

---

## Feature Specification

### Module 1: Property & Unit Management

#### Core Features
```
┌─────────────────────────────────────────────────────────────┐
│ PROPERTIES                                                   │
├─────────────────────────────────────────────────────────────┤
│ + Add Property                                               │
│                                                              │
│ 🏠 123 Main Street                        2 units           │
│    └─ Unit A (Occupied - Johnson)         $1,200/mo         │
│    └─ Unit B (Vacant since Jan 15)        $1,100/mo         │
│                                                              │
│ 🏠 456 Oak Avenue                         1 unit            │
│    └─ Single Family (Occupied - Smith)    $1,800/mo         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Property Data Model
```typescript
interface Property {
  id: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  type: 'single_family' | 'multi_family' | 'condo' | 'townhouse';
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  mortgageInfo?: {
    lender: string;
    monthlyPayment: number;
    escrowIncluded: boolean;
  };
  insurance?: {
    provider: string;
    policyNumber: string;
    annualPremium: number;
    renewalDate: Date;
  };
  documents: Document[]; // Deeds, insurance, etc.
  units: Unit[];
  createdAt: Date;
  updatedAt: Date;
}

interface Unit {
  id: string;
  propertyId: string;
  name: string; // "Unit A", "Basement Apt", "Main House"
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  monthlyRent: number;
  securityDeposit: number;
  status: 'occupied' | 'vacant' | 'maintenance';
  currentLease?: Lease;
  appliances: Appliance[]; // For maintenance tracking
}
```

---

### Module 2: Tenant & Lease Management

#### Core Features
- Tenant contact info (phone, email, emergency contact)
- Lease tracking with key dates
- Rent amount and due date
- Security deposit tracking
- Move-in/move-out checklists with photos

#### Tenant Data Model
```typescript
interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: Document[]; // ID copies, application, etc.
  notes: string;
  createdAt: Date;
}

interface Lease {
  id: string;
  unitId: string;
  tenants: string[]; // Tenant IDs
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  securityDeposit: number;
  securityDepositHeld: number;
  rentDueDay: number; // 1-31
  lateFeeAmount?: number;
  lateFeeGracePeriod?: number; // Days
  terms: string; // Additional terms
  document?: Document; // Signed lease PDF
  status: 'active' | 'expired' | 'terminated';
  renewalReminder: boolean;
  renewalReminderDays: number; // Days before end
}
```

#### Move-In/Move-Out Checklist
```
┌─────────────────────────────────────────────────────────────┐
│ MOVE-IN INSPECTION - Unit A, 123 Main St                    │
│ Date: 2024-02-01    Tenant: Mike Johnson                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ LIVING ROOM                                                  │
│ ├─ Walls          [Good ▼]  Notes: Small scuff near door    │
│ ├─ Flooring       [Good ▼]  📷 2 photos                     │
│ ├─ Windows        [Good ▼]                                   │
│ ├─ Light fixtures [Fair ▼]  Notes: Dimmer switch sticky     │
│ └─ Outlets        [Good ▼]                                   │
│                                                              │
│ KITCHEN                                                      │
│ ├─ Appliances     [Good ▼]  📷 4 photos                     │
│ ...                                                          │
│                                                              │
│ [Tenant Signature: ✓ Signed digitally]                      │
│ [Landlord Signature: ✓ Signed digitally]                    │
│                                                              │
│ [📄 Generate PDF Report]                                    │
└─────────────────────────────────────────────────────────────┘
```

---

### Module 3: Rent Tracking (The Critical Flow)

#### Core Philosophy
**Make logging a rent payment take < 5 seconds**

#### Rent Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ RENT - January 2024                          [< Prev] [Next >]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 123 Main St - Unit A (Johnson)                               │
│ ├─ Due: $1,200 on Jan 1                                      │
│ ├─ Status: ✅ PAID Jan 3 (+$25 late fee)                    │
│ └─ Method: Zelle                                             │
│                                                              │
│ 123 Main St - Unit B (VACANT)                                │
│ └─ No rent due                                               │
│                                                              │
│ 456 Oak Ave (Smith)                                          │
│ ├─ Due: $1,800 on Jan 1                                      │
│ ├─ Status: ⚠️ OVERDUE (5 days)                              │
│ └─ [📱 Send Reminder] [💰 Log Payment]                      │
│                                                              │
│ ─────────────────────────────────────────────────────────── │
│ Monthly Summary: $3,000 expected | $1,225 received          │
└─────────────────────────────────────────────────────────────┘
```

#### Quick Payment Entry (Mobile-Optimized)
```
┌─────────────────────────────────────────────────────────────┐
│ LOG RENT PAYMENT                                      [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Property:  [123 Main St - Unit A    ▼]                      │
│                                                              │
│ Amount:    [$1,200    ]  [+Late Fee $25]                    │
│                                                              │
│ Date:      [Today ▼]  Jan 28, 2024                          │
│                                                              │
│ Method:    ○ Cash  ○ Check  ● Zelle  ○ Venmo  ○ Other      │
│                                                              │
│ Check #:   [________] (if check selected)                   │
│                                                              │
│ Notes:     [Partial payment - will pay rest Fri]            │
│                                                              │
│            [💾 SAVE PAYMENT]                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### Payment Data Model
```typescript
interface RentPayment {
  id: string;
  leaseId: string;
  amount: number;
  lateFeeAmount?: number;
  paymentDate: Date;
  periodStart: Date; // Which month this covers
  periodEnd: Date;
  method: 'cash' | 'check' | 'zelle' | 'venmo' | 'paypal' | 'bank_transfer' | 'other';
  checkNumber?: string;
  referenceNumber?: string;
  notes?: string;
  receiptDocument?: Document;
  createdAt: Date;
}
```

#### Automated Reminders
```typescript
interface RentReminder {
  id: string;
  leaseId: string;
  type: 'upcoming' | 'due_today' | 'overdue';
  daysOffset: number; // -3 = 3 days before, +5 = 5 days overdue
  channel: 'email' | 'sms' | 'in_app';
  template: string;
  enabled: boolean;
}

// Default reminder schedule:
// - 3 days before due: "Friendly reminder"
// - Due date: "Rent is due today"
// - 3 days overdue: "Your rent is overdue"
// - 7 days overdue: "Urgent: Rent overdue"
```

---

### Module 4: Expense Tracking (Tax-Ready)

#### Core Philosophy
**Every expense should auto-categorize for Schedule E**

#### IRS Schedule E Categories (Built-In)
```typescript
const SCHEDULE_E_CATEGORIES = {
  advertising: "Advertising",
  auto_travel: "Auto and travel",
  cleaning_maintenance: "Cleaning and maintenance", 
  commissions: "Commissions",
  insurance: "Insurance",
  legal_professional: "Legal and other professional fees",
  management_fees: "Management fees",
  mortgage_interest: "Mortgage interest",
  other_interest: "Other interest",
  repairs: "Repairs",
  supplies: "Supplies",
  taxes: "Taxes",
  utilities: "Utilities",
  depreciation: "Depreciation", // Auto-calculated
  other: "Other"
};
```

#### Expense Entry (Mobile Receipt Capture)
```
┌─────────────────────────────────────────────────────────────┐
│ ADD EXPENSE                                           [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │           📷 TAP TO CAPTURE RECEIPT                    │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Property:  [123 Main St ▼]  □ All properties               │
│                                                              │
│ Amount:    [$_______]                                       │
│                                                              │
│ Date:      [Today ▼]                                        │
│                                                              │
│ Category:  [Repairs ▼]  ← Auto-suggested from vendor        │
│                                                              │
│ Vendor:    [Home Depot]  (auto-complete from history)       │
│                                                              │
│ Description: [Replaced kitchen faucet]                      │
│                                                              │
│            [💾 SAVE EXPENSE]                                │
└─────────────────────────────────────────────────────────────┘
```

#### Expense Data Model
```typescript
interface Expense {
  id: string;
  propertyId: string | null; // null = applies to all
  unitId?: string;
  amount: number;
  date: Date;
  category: keyof typeof SCHEDULE_E_CATEGORIES;
  vendor: string;
  description: string;
  receiptImage?: string; // Base64 or file path
  receiptDocument?: Document;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'check' | 'bank_transfer';
  isRecurring: boolean;
  recurringExpenseId?: string;
  taxDeductible: boolean; // Default true
  createdAt: Date;
}

interface RecurringExpense {
  id: string;
  propertyId: string | null;
  amount: number;
  category: keyof typeof SCHEDULE_E_CATEGORIES;
  vendor: string;
  description: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  dayOfMonth?: number;
  monthOfYear?: number; // For annual
  autoCreate: boolean; // Auto-create expense entries
  nextDueDate: Date;
}
```

#### Smart Vendor Recognition
```typescript
// Auto-categorize based on vendor history
const VENDOR_CATEGORY_MAP = {
  "home depot": "repairs",
  "lowes": "repairs", 
  "ace hardware": "repairs",
  "state farm": "insurance",
  "allstate": "insurance",
  "water company": "utilities",
  "electric company": "utilities",
  "roto rooter": "repairs",
  // ... learns from user entries
};
```

---

### Module 5: Maintenance Scheduler (The Differentiator)

#### Core Philosophy
**Landlords forget inspections. We won't let them.**

#### Maintenance Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 MAINTENANCE                                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ⚠️ OVERDUE                                                  │
│ ├─ Smoke detector battery - 123 Main St (14 days overdue)   │
│ │   Last done: Dec 15, 2023 | Due: Jan 15, 2024            │
│ │   [✓ Mark Done] [📅 Reschedule] [🔕 Snooze 7 days]       │
│                                                              │
│ 📅 UPCOMING (Next 30 days)                                  │
│ ├─ HVAC filter change - 456 Oak Ave (Feb 1)                 │
│ ├─ Pest control - All properties (Feb 15)                   │
│ └─ Lease renewal reminder - Unit A (Feb 28)                 │
│                                                              │
│ ✅ RECENTLY COMPLETED                                        │
│ ├─ Gutter cleaning - 123 Main St (Jan 20)                   │
│ └─ Water heater flush - 456 Oak Ave (Jan 18)                │
│                                                              │
│ [+ Add Maintenance Task] [📋 Maintenance Templates]         │
└─────────────────────────────────────────────────────────────┘
```

#### Pre-Built Maintenance Templates
```typescript
const MAINTENANCE_TEMPLATES = [
  {
    name: "Smoke/CO Detector Check",
    frequency: "every_6_months",
    description: "Test all smoke and CO detectors, replace batteries",
    category: "safety",
    estimatedCost: 20,
    requiredByLaw: true
  },
  {
    name: "HVAC Filter Change",
    frequency: "every_3_months", 
    description: "Replace HVAC air filters",
    category: "hvac",
    estimatedCost: 30
  },
  {
    name: "HVAC Professional Service",
    frequency: "annually",
    description: "Annual HVAC inspection and tune-up",
    category: "hvac",
    estimatedCost: 150
  },
  {
    name: "Pest Control",
    frequency: "quarterly",
    description: "Professional pest control treatment",
    category: "pest_control",
    estimatedCost: 100
  },
  {
    name: "Gutter Cleaning",
    frequency: "every_6_months",
    description: "Clean gutters and downspouts",
    category: "exterior",
    estimatedCost: 150
  },
  {
    name: "Water Heater Flush",
    frequency: "annually",
    description: "Drain and flush water heater",
    category: "plumbing",
    estimatedCost: 0 // DIY
  },
  {
    name: "Dryer Vent Cleaning",
    frequency: "annually",
    description: "Clean dryer vent to prevent fire hazard",
    category: "safety",
    estimatedCost: 100,
    requiredByLaw: true
  },
  {
    name: "Fire Extinguisher Check",
    frequency: "annually",
    description: "Inspect fire extinguisher, replace if needed",
    category: "safety",
    estimatedCost: 50
  }
];
```

#### Maintenance Data Model
```typescript
interface MaintenanceTask {
  id: string;
  propertyId: string | null; // null = all properties
  unitId?: string;
  templateId?: string;
  name: string;
  description: string;
  category: 'safety' | 'hvac' | 'plumbing' | 'electrical' | 'exterior' | 'interior' | 'pest_control' | 'appliance' | 'other';
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'every_6_months' | 'annually' | 'custom';
  customFrequencyDays?: number;
  dueDate: Date;
  reminderDays: number[]; // [7, 3, 1, 0, -3] = 7 days before, 3 before, day of, 3 days after
  status: 'pending' | 'overdue' | 'completed' | 'skipped';
  completedDate?: Date;
  completedNotes?: string;
  completedPhotos?: string[];
  linkedExpenseId?: string;
  estimatedCost?: number;
  actualCost?: number;
  vendor?: string;
  requiredByLaw: boolean;
  createdAt: Date;
}

interface MaintenanceCompletion {
  id: string;
  taskId: string;
  completedDate: Date;
  notes: string;
  photos: string[];
  cost: number;
  expenseId?: string; // Link to expense if logged
  performedBy: 'self' | 'contractor';
  contractorName?: string;
}
```

#### Appliance Tracking (Sub-feature)
```typescript
interface Appliance {
  id: string;
  unitId: string;
  type: 'refrigerator' | 'stove' | 'dishwasher' | 'washer' | 'dryer' | 'hvac' | 'water_heater' | 'garbage_disposal' | 'microwave' | 'other';
  brand: string;
  model: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiration?: Date;
  lastServiceDate?: Date;
  notes: string;
  documents: Document[]; // Manuals, receipts
}
```

---

### Module 6: Document Storage

#### Core Features
- Store leases, insurance policies, deeds, inspection reports
- Tag documents by property/unit/tenant
- Quick search and retrieval
- Optional local encryption

#### Document Data Model
```typescript
interface Document {
  id: string;
  name: string;
  type: 'lease' | 'insurance' | 'deed' | 'inspection' | 'receipt' | 'photo' | 'correspondence' | 'tax' | 'other';
  filePath: string;
  fileSize: number;
  mimeType: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  expenseId?: string;
  tags: string[];
  expirationDate?: Date; // For insurance, leases
  reminderBeforeExpiration?: number; // Days
  uploadedAt: Date;
  encrypted: boolean;
}
```

---

### Module 7: Reporting

#### Tax Report (Schedule E Ready)
```
┌─────────────────────────────────────────────────────────────┐
│ TAX REPORT - 2024                                    [📥 PDF]│
├─────────────────────────────────────────────────────────────┤
│ Property: 123 Main Street                                    │
│                                                              │
│ INCOME                                                       │
│ ├─ Rents received                           $26,400.00      │
│ └─ Security deposits forfeited                  $200.00      │
│ TOTAL INCOME                                $26,600.00      │
│                                                              │
│ EXPENSES                                                     │
│ ├─ Advertising                                  $150.00      │
│ ├─ Cleaning and maintenance                     $840.00      │
│ ├─ Insurance                                  $1,200.00      │
│ ├─ Legal and professional fees                  $350.00      │
│ ├─ Mortgage interest                          $8,400.00      │
│ ├─ Repairs                                    $2,150.00      │
│ ├─ Supplies                                     $280.00      │
│ ├─ Taxes (property)                           $3,200.00      │
│ └─ Utilities (landlord-paid)                    $600.00      │
│ TOTAL EXPENSES                              $17,170.00      │
│                                                              │
│ NET INCOME (LOSS)                            $9,430.00      │
│                                                              │
│ [📋 View All Receipts] [📊 Export to CSV]                   │
└─────────────────────────────────────────────────────────────┘
```

#### Cash Flow Report
```
┌─────────────────────────────────────────────────────────────┐
│ CASH FLOW - January 2024                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ INCOME                                                       │
│ ├─ 123 Main St - Unit A                       $1,225.00     │
│ ├─ 123 Main St - Unit B (vacant)                  $0.00     │
│ └─ 456 Oak Avenue                             $1,800.00     │
│ Total Income                                  $3,025.00     │
│                                                              │
│ EXPENSES                                                     │
│ ├─ Mortgage - 123 Main St                     $1,100.00     │
│ ├─ Mortgage - 456 Oak Ave                     $1,400.00     │
│ ├─ Plumber repair - Unit A                      $185.00     │
│ └─ Supplies                                      $42.00     │
│ Total Expenses                                $2,727.00     │
│                                                              │
│ NET CASH FLOW                                   $298.00     │
│                                                              │
│      Jan    Feb    Mar    Apr    May    Jun                 │
│     ┌────────────────────────────────────────┐              │
│ +$1k│    ▓▓▓                                 │              │
│    0│─────────────────────────────────────── │              │
│ -$1k│         ░░░  ░░░                       │              │
│     └────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         NestKeeper                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │   Mobile    │    │   Desktop   │    │   Tablet    │          │
│  │    PWA      │    │    PWA      │    │    PWA      │          │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘          │
│         │                  │                  │                   │
│         └──────────────────┼──────────────────┘                   │
│                            │                                      │
│                    ┌───────▼───────┐                             │
│                    │   Frontend    │                             │
│                    │  (React/Vue)  │                             │
│                    │    + PWA      │                             │
│                    └───────┬───────┘                             │
│                            │ REST API                            │
│                    ┌───────▼───────┐                             │
│                    │    Backend    │                             │
│                    │   (Node.js)   │                             │
│                    └───────┬───────┘                             │
│                            │                                      │
│         ┌──────────────────┼──────────────────┐                  │
│         │                  │                  │                   │
│  ┌──────▼──────┐   ┌───────▼───────┐  ┌──────▼──────┐           │
│  │  SQLite DB  │   │  File Storage │  │   Backup    │           │
│  │  (Primary)  │   │  (Documents)  │  │   System    │           │
│  └─────────────┘   └───────────────┘  └─────────────┘           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Option A: Node.js Stack (Recommended for simplicity)

```yaml
Frontend:
  framework: "React 18 with TypeScript"
  ui_library: "Tailwind CSS + shadcn/ui"
  state: "Zustand (simple) or TanStack Query"
  pwa: "Workbox for service worker"
  forms: "React Hook Form + Zod validation"
  
Backend:
  runtime: "Node.js 20 LTS"
  framework: "Fastify (fast) or Express (familiar)"
  orm: "Drizzle ORM (type-safe, lightweight)"
  validation: "Zod"
  auth: "Passport.js with local strategy"
  
Database:
  primary: "SQLite (simple, no server needed)"
  option_scale: "PostgreSQL (if scaling needed)"
  migrations: "Drizzle Kit"
  
Deployment:
  container: "Docker + Docker Compose"
  reverse_proxy: "Caddy (automatic HTTPS)"
  process_manager: "PM2 (if not Docker)"
```

#### Option B: Go Stack (For performance enthusiasts)

```yaml
Frontend:
  same: "React PWA (shared)"
  
Backend:
  language: "Go 1.22+"
  framework: "Echo or Fiber"
  orm: "GORM or sqlc"
  
Benefits:
  - Single binary deployment
  - Lower memory footprint
  - Faster cold starts
```

### Database Schema (SQLite)

```sql
-- Properties
CREATE TABLE properties (
    id TEXT PRIMARY KEY,
    address_street TEXT NOT NULL,
    address_city TEXT NOT NULL,
    address_state TEXT NOT NULL,
    address_zip TEXT NOT NULL,
    address_country TEXT DEFAULT 'USA',
    property_type TEXT NOT NULL CHECK (property_type IN ('single_family', 'multi_family', 'condo', 'townhouse')),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Units
CREATE TABLE units (
    id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms DECIMAL(3,1) DEFAULT 0,
    square_feet INTEGER,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2),
    status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tenants
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leases
CREATE TABLE leases (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES units(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    rent_due_day INTEGER NOT NULL DEFAULT 1,
    late_fee_amount DECIMAL(10,2),
    late_fee_grace_days INTEGER DEFAULT 5,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
    renewal_reminder_days INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Lease-Tenant junction
CREATE TABLE lease_tenants (
    lease_id TEXT NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (lease_id, tenant_id)
);

-- Rent Payments
CREATE TABLE rent_payments (
    id TEXT PRIMARY KEY,
    lease_id TEXT NOT NULL REFERENCES leases(id),
    amount DECIMAL(10,2) NOT NULL,
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    payment_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'check', 'zelle', 'venmo', 'paypal', 'bank_transfer', 'other')),
    check_number TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE expenses (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id),
    unit_id TEXT REFERENCES units(id),
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    vendor TEXT,
    description TEXT,
    receipt_path TEXT,
    payment_method TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_expense_id TEXT REFERENCES recurring_expenses(id),
    tax_deductible BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_property ON expenses(property_id);

-- Recurring Expenses
CREATE TABLE recurring_expenses (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id),
    amount DECIMAL(10,2) NOT NULL,
    category TEXT NOT NULL,
    vendor TEXT,
    description TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annually')),
    day_of_month INTEGER,
    month_of_year INTEGER,
    auto_create BOOLEAN DEFAULT TRUE,
    next_due_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Tasks
CREATE TABLE maintenance_tasks (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id),
    unit_id TEXT REFERENCES units(id),
    template_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    frequency TEXT NOT NULL,
    custom_frequency_days INTEGER,
    due_date DATE NOT NULL,
    reminder_days TEXT, -- JSON array
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'completed', 'skipped')),
    completed_date DATE,
    completed_notes TEXT,
    linked_expense_id TEXT REFERENCES expenses(id),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    vendor TEXT,
    required_by_law BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_due ON maintenance_tasks(due_date);
CREATE INDEX idx_maintenance_status ON maintenance_tasks(status);

-- Documents
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    property_id TEXT REFERENCES properties(id),
    unit_id TEXT REFERENCES units(id),
    tenant_id TEXT REFERENCES tenants(id),
    expense_id TEXT REFERENCES expenses(id),
    tags TEXT, -- JSON array
    expiration_date DATE,
    encrypted BOOLEAN DEFAULT FALSE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Appliances
CREATE TABLE appliances (
    id TEXT PRIMARY KEY,
    unit_id TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    warranty_expiration DATE,
    last_service_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notification Settings
CREATE TABLE notification_settings (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'rent_reminder', 'maintenance_due', 'lease_expiring'
    enabled BOOLEAN DEFAULT TRUE,
    days_before INTEGER,
    channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email', 'sms')),
    template TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log (optional but recommended)
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'create', 'update', 'delete'
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Design

```yaml
# RESTful API Endpoints

# Properties
GET    /api/properties              # List all properties
POST   /api/properties              # Create property
GET    /api/properties/:id          # Get property details
PUT    /api/properties/:id          # Update property
DELETE /api/properties/:id          # Delete property
GET    /api/properties/:id/units    # List units for property

# Units
GET    /api/units                   # List all units
POST   /api/units                   # Create unit
GET    /api/units/:id               # Get unit details
PUT    /api/units/:id               # Update unit
DELETE /api/units/:id               # Delete unit

# Tenants
GET    /api/tenants                 # List all tenants
POST   /api/tenants                 # Create tenant
GET    /api/tenants/:id             # Get tenant details
PUT    /api/tenants/:id             # Update tenant
DELETE /api/tenants/:id             # Delete tenant

# Leases
GET    /api/leases                  # List all leases
POST   /api/leases                  # Create lease
GET    /api/leases/:id              # Get lease details
PUT    /api/leases/:id              # Update lease
DELETE /api/leases/:id              # Delete lease
GET    /api/leases/expiring         # Get leases expiring soon

# Rent Payments
GET    /api/rent-payments           # List payments (with filters)
POST   /api/rent-payments           # Log payment
GET    /api/rent-payments/:id       # Get payment details
DELETE /api/rent-payments/:id       # Delete payment
GET    /api/rent/status             # Get current rent status for all units
GET    /api/rent/status/:month      # Get rent status for specific month

# Expenses
GET    /api/expenses                # List expenses (with filters)
POST   /api/expenses                # Create expense
GET    /api/expenses/:id            # Get expense details
PUT    /api/expenses/:id            # Update expense
DELETE /api/expenses/:id            # Delete expense
POST   /api/expenses/receipt        # Upload receipt image
GET    /api/expenses/categories     # Get category breakdown

# Maintenance
GET    /api/maintenance             # List all tasks
POST   /api/maintenance             # Create task
GET    /api/maintenance/:id         # Get task details
PUT    /api/maintenance/:id         # Update task
DELETE /api/maintenance/:id         # Delete task
POST   /api/maintenance/:id/complete # Mark task complete
GET    /api/maintenance/overdue     # Get overdue tasks
GET    /api/maintenance/upcoming    # Get upcoming tasks
GET    /api/maintenance/templates   # Get maintenance templates

# Documents
GET    /api/documents               # List documents (with filters)
POST   /api/documents               # Upload document
GET    /api/documents/:id           # Get document details
GET    /api/documents/:id/download  # Download document
DELETE /api/documents/:id           # Delete document

# Reports
GET    /api/reports/tax/:year       # Schedule E report
GET    /api/reports/cash-flow       # Cash flow report
GET    /api/reports/property/:id    # Property P&L report
GET    /api/reports/export/csv      # Export data as CSV

# Settings
GET    /api/settings                # Get all settings
PUT    /api/settings                # Update settings
GET    /api/settings/notifications  # Get notification settings
PUT    /api/settings/notifications  # Update notification settings

# Backup
POST   /api/backup/create           # Create backup
GET    /api/backup/list             # List backups
POST   /api/backup/restore          # Restore from backup
GET    /api/backup/download/:id     # Download backup file
```

### Folder Structure

```
nestkeeper/
├── docker-compose.yml
├── Dockerfile
├── README.md
├── .env.example
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   ├── sw.js              # Service worker
│   │   └── icons/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ui/            # shadcn components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── MobileNav.tsx
│   │   │   ├── properties/
│   │   │   │   ├── PropertyList.tsx
│   │   │   │   ├── PropertyCard.tsx
│   │   │   │   └── PropertyForm.tsx
│   │   │   ├── rent/
│   │   │   │   ├── RentDashboard.tsx
│   │   │   │   ├── PaymentForm.tsx
│   │   │   │   └── RentCalendar.tsx
│   │   │   ├── expenses/
│   │   │   │   ├── ExpenseList.tsx
│   │   │   │   ├── ExpenseForm.tsx
│   │   │   │   └── ReceiptCapture.tsx
│   │   │   ├── maintenance/
│   │   │   │   ├── MaintenanceDashboard.tsx
│   │   │   │   ├── TaskForm.tsx
│   │   │   │   └── TemplateList.tsx
│   │   │   └── reports/
│   │   │       ├── TaxReport.tsx
│   │   │       └── CashFlowReport.tsx
│   │   ├── hooks/
│   │   │   ├── useProperties.ts
│   │   │   ├── useRent.ts
│   │   │   ├── useExpenses.ts
│   │   │   ├── useMaintenance.ts
│   │   │   └── useOffline.ts
│   │   ├── stores/
│   │   │   └── appStore.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── styles/
│   │       └── globals.css
│   └── tsconfig.json
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── app.ts             # Fastify setup
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── database.ts
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── routes/
│   │   │   ├── properties.ts
│   │   │   ├── units.ts
│   │   │   ├── tenants.ts
│   │   │   ├── leases.ts
│   │   │   ├── rent.ts
│   │   │   ├── expenses.ts
│   │   │   ├── maintenance.ts
│   │   │   ├── documents.ts
│   │   │   ├── reports.ts
│   │   │   └── backup.ts
│   │   ├── services/
│   │   │   ├── propertyService.ts
│   │   │   ├── rentService.ts
│   │   │   ├── expenseService.ts
│   │   │   ├── maintenanceService.ts
│   │   │   ├── reportService.ts
│   │   │   ├── notificationService.ts
│   │   │   └── backupService.ts
│   │   ├── jobs/
│   │   │   ├── scheduler.ts   # Task scheduler
│   │   │   ├── rentReminders.ts
│   │   │   ├── maintenanceReminders.ts
│   │   │   └── recurringExpenses.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── validate.ts
│   │   ├── utils/
│   │   │   ├── pdf.ts         # PDF generation
│   │   │   ├── csv.ts         # CSV export
│   │   │   └── encryption.ts
│   │   └── types/
│   │       └── index.ts
│   └── drizzle.config.ts
│
├── data/                       # SQLite DB & uploads (mounted volume)
│   ├── nestkeeper.db
│   ├── documents/
│   └── backups/
│
└── scripts/
    ├── setup.sh
    ├── backup.sh
    └── restore.sh
```

---

## Deployment Options

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'

services:
  nestkeeper:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - DATABASE_PATH=/app/data/nestkeeper.db
      - UPLOAD_PATH=/app/data/documents
      - BACKUP_PATH=/app/data/backups
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    restart: unless-stopped

  # Optional: Caddy for HTTPS
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on:
      - nestkeeper

volumes:
  caddy_data:
```

### Option 2: Single Binary (Go version)

```bash
# Download and run
./nestkeeper --port 3000 --data-dir ./data

# Or with systemd
sudo systemctl enable nestkeeper
sudo systemctl start nestkeeper
```

### Option 3: Raspberry Pi / Home Server

```bash
# ARM64 support
docker pull nestkeeper/nestkeeper:latest-arm64
docker run -d -p 3000:3000 -v ~/nestkeeper-data:/app/data nestkeeper/nestkeeper:latest-arm64
```

---

## Monetization Strategy

### Open-Core Model

```
┌─────────────────────────────────────────────────────────────┐
│ FREE (Community Edition)                                     │
├─────────────────────────────────────────────────────────────┤
│ ✓ Unlimited properties & units                               │
│ ✓ Full rent tracking                                         │
│ ✓ Expense tracking with categories                           │
│ ✓ Basic maintenance reminders                                │
│ ✓ Document storage                                           │
│ ✓ Tax reports (Schedule E)                                   │
│ ✓ Self-hosted, full data ownership                           │
│ ✓ Community support (GitHub/Discord)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRO ($99 one-time OR $9/month)                              │
├─────────────────────────────────────────────────────────────┤
│ Everything in Free, plus:                                    │
│ ✓ Email/SMS notifications                                    │
│ ✓ Automated rent reminders to tenants                        │
│ ✓ Receipt OCR (extract amount/vendor)                        │
│ ✓ Tenant portal (view lease, submit maintenance)            │
│ ✓ Move-in/move-out checklists with signatures               │
│ ✓ Advanced reports (year-over-year, ROI)                    │
│ ✓ Encrypted backups to cloud (optional)                     │
│ ✓ Priority email support                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Development Roadmap

### Phase 1: MVP (8-12 weeks)
- [ ] Core database schema
- [ ] Property/Unit CRUD
- [ ] Tenant/Lease management
- [ ] Rent payment tracking
- [ ] Basic expense tracking
- [ ] Simple maintenance tasks
- [ ] Mobile-responsive UI
- [ ] Docker deployment

### Phase 2: Polish (4-6 weeks)
- [ ] PWA with offline support
- [ ] Receipt image capture
- [ ] Tax report generation (PDF)
- [ ] Recurring expenses
- [ ] Maintenance templates
- [ ] In-app notifications

### Phase 3: Pro Features (6-8 weeks)
- [ ] Email notification service
- [ ] Tenant portal
- [ ] Move-in/out checklists
- [ ] Advanced reports
- [ ] Backup to S3/B2

### Phase 4: Growth (Ongoing)
- [ ] Public API
- [ ] Zapier integration
- [ ] Community templates
- [ ] Multi-language support

---

## Success Metrics

### User Acquisition
- GitHub stars: 1,000 in first 6 months
- Docker pulls: 5,000 in first year
- Active installations: 500 by month 12

### Revenue (if monetizing)
- 50 Pro licenses in first 6 months = $4,950
- 200 Pro licenses by month 12 = $19,800
- Or SaaS: 100 users at $9/mo = $10,800 ARR

### User Satisfaction
- NPS > 50
- < 5% churn on Pro
- Active community contributions

---

## Competitive Differentiation

| Feature | NestKeeper | Landlord Studio | Stessa | TurboTenant |
|---------|-----------|-----------------|--------|-------------|
| Self-hosted | ✅ | ❌ | ❌ | ❌ |
| One-time pricing | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Offline capable | ✅ | ❌ | ❌ | ❌ |
| <10 units focus | ✅ | Partial | Partial | ✅ |
| Maintenance scheduling | ✅✅ | ✅ | ❌ | ❌ |
| Privacy-first | ✅✅ | ❌ | ❌ | ❌ |

---

## Final Notes

This design prioritizes:
1. **Simplicity over features** - Do 5 things perfectly vs 50 things poorly
2. **Privacy by design** - Self-hosted, no tracking, encrypted options
3. **Mobile-first** - Most interactions happen on a phone
4. **Tax-ready** - Every expense maps to Schedule E
5. **Proactive maintenance** - The killer feature competitors lack

The next step is to create a detailed implementation prompt for building this system.
