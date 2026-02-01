# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NestKeeper** is a self-hosted, privacy-first property management application for small landlords (1-10 units). Currently in design phase - no code implemented yet.

## Chosen Architecture: Go + React

After evaluating options in `architecture-decision-record.md`, the chosen stack is:

**Backend: Go**
- Framework: Echo (simpler) or Fiber
- Database: SQLite with GORM (learning-friendly) → migrate to sqlc later
- Single binary deployment, ~15MB RAM, no runtime dependencies

**Frontend: React + TypeScript**
- Bundler: Vite
- Styling: TailwindCSS + shadcn/ui
- Data fetching: TanStack Query
- Forms: React Hook Form + Zod

**Why this combination:**
- Go: Security (no npm supply chain), simple deployment, explicit error handling
- React: Mature ecosystem, abundant learning resources, shadcn/ui components

## Key Documentation

- `landlord-tool-design.md` - Product specs, data models, UI mockups, API design
- `architecture-decision-record.md` - Technical rationale, performance comparisons
- `nestkeeper-implementation-prompt.md` - Database schema, code examples (Node.js versions to adapt)

## Project Structure (Planned)

```
nestkeeper/
├── main.go
├── go.mod
├── internal/
│   ├── server/        # Echo setup, middleware, routes
│   ├── handlers/      # HTTP handlers
│   ├── models/        # Data structures
│   ├── db/            # GORM models, migrations
│   └── services/      # Business logic
├── web/               # Embedded frontend build
│   └── dist/
├── frontend/          # React source
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── pages/
│   └── package.json
├── data/              # Runtime: SQLite DB, uploads
└── Dockerfile
```

## Build Commands (When Implemented)

```bash
# Backend
go run main.go              # Development
go build -o nestkeeper      # Production binary

# Frontend
cd frontend && npm run dev   # Dev server
cd frontend && npm run build # Build to web/dist

# Full build
go build -o nestkeeper      # Embeds frontend via go:embed

# Docker
docker build -t nestkeeper .
docker run -p 3000:3000 -v ./data:/app/data nestkeeper
```

## Core Modules

1. **Properties & Units** - CRUD for rental properties
2. **Tenants & Leases** - Lease tracking, key dates, renewals
3. **Rent Tracking** - Payment status: paid/partial/unpaid/overdue
4. **Expenses** - IRS Schedule E categories, receipt photos
5. **Maintenance** - Recurring tasks with templates and reminders
6. **Documents** - Centralized file storage
7. **Reports** - Schedule E tax report, cash flow

## Database Schema

SQLite with GORM. Key tables (see `nestkeeper-implementation-prompt.md` for full schema):
- `properties`, `units`, `tenants`, `leases`, `lease_tenants`
- `rent_payments`, `expenses`, `recurring_expenses`
- `maintenance_tasks`, `documents`, `appliances`

Adapt the Drizzle schema in the implementation prompt to GORM structs.

## API Endpoints

RESTful design (see `landlord-tool-design.md` lines 957-1040):
```
GET/POST   /api/properties
GET/PUT    /api/properties/:id
GET/POST   /api/rent/payments
GET        /api/rent/status
GET/POST   /api/maintenance
POST       /api/maintenance/:id/complete
GET        /api/reports/tax/:year
```

## Performance Targets

- Rent payment logging: < 5 seconds on mobile
- API responses: < 50ms (p99)
- Initial load: < 3 seconds
- Binary size: ~15MB
- Memory usage: < 30MB

## Key Patterns

- **IDs**: UUID via Go's `google/uuid`
- **Timestamps**: ISO 8601 strings or `time.Time`
- **Rent status**: Calculated field (paid/partial/unpaid/overdue)
- **Maintenance**: Completing a recurring task auto-creates the next one
- **Mobile-first**: Bottom sheets for forms, large touch targets
- **Validation**: Validate at handler level before hitting services
