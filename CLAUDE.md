# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anclora Flow is a fiscal CRM and financial platform for digital freelancers in Spain, with multi-language support (Spanish/English), multi-project architecture, and modular scalability. It features invoice/expense management, AI assistants with RAG, OAuth authentication, and VeriFactu Spanish tax compliance integration.

## Common Commands

### Backend (`backend/`)
```bash
npm run dev          # Build TypeScript and run development server
npm run build        # Compile TypeScript to dist/ (copies SQL files)
npm run start        # Run compiled backend
npm run kill-port    # Kill process on port 8020 (Windows)
```

### Frontend (`frontend/`)
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking without emitting
npm run kill-port    # Kill process on port 5173 (Windows)
```

### Full Stack (Docker)
```bash
docker-compose up --build    # Start entire stack (frontend, backend, PostgreSQL, AI services)
```

### Database
```bash
# Initialize schema
psql -U postgres -d anclora_flow -f backend/src/database/init.sql

# With Docker
docker exec -i anclora-postgres psql -U postgres -d anclora_flow < backend/src/database/init.sql
```

## Port Configuration

| Service   | Port |
|-----------|------|
| Frontend  | 3020 |
| Backend   | 8020 |
| Database  | 5452 |
| AI Services | 8021 |

## Architecture

```
Anclora-Flow/
├── backend/              # Node.js + Express + TypeScript API
│   └── src/
│       ├── api/          # Route handlers by domain (auth, invoices, expenses, clients, projects, budgets, verifactu, payments, bank-accounts, subscriptions, receipts)
│       ├── database/     # PostgreSQL config, init.sql, seed-data.sql, migrations/
│       ├── models/       # TypeScript data models
│       ├── middleware/   # Express middleware
│       ├── repositories/ # Data access layer
│       ├── services/     # Business logic layer
│       └── types/        # TypeScript interfaces
├── frontend/             # React 19 + Vite SPA
│   └── src/
│       ├── components/   # Reusable UI (Button, Card, Input, Layout, Table, forms, features)
│       ├── pages/        # Page components (Dashboard, Invoices, Expenses, Clients, Budget, Assistant)
│       ├── services/     # API client
│       ├── stores/       # State management
│       └── i18n/         # Internationalization
├── ai-services/          # Python FastAPI
│   ├── orchestrator/     # Agent orchestration
│   └── rag/              # Retrieval-Augmented Generation
├── infrastructure/       # Docker, Kubernetes, Terraform configs
├── shared/               # Shared constants, types, utils
└── docs/                 # Documentation
```

### Backend Architecture Pattern
- **API routes** (`api/`) → **Services** (`services/`) → **Repositories** (`repositories/`) → **PostgreSQL**
- Authentication: Passport.js with Google/GitHub OAuth + JWT tokens
- Database: PostgreSQL with `pg` driver, connection pool in `database/config.ts`

### Frontend Architecture
- React 19 with react-router-dom for routing
- TanStack React Query for server state management
- Vite proxies `/api` requests to backend at `http://localhost:8020`

## Tech Stack

- **Backend**: Node.js + Express 4.18 + TypeScript 5.9, PostgreSQL 16, bcrypt, jsonwebtoken, Passport.js
- **Frontend**: React 19 + Vite 6.1 + TypeScript 5.7, TanStack React Query, lucide-react icons
- **AI Services**: Python + FastAPI 0.104.1 + Uvicorn
- **Auth**: JWT + OAuth (Google, GitHub)

## UI/UX Guidelines

### Modals (Critical)
- **No vertical scroll on open**: All initial content must be visible without scrolling
- Validate at 100%, 110%, and 125% browser zoom
- Scroll only appears when adding dynamic content (2+ invoice lines)
- Use `modal__panel--wide` for invoices/budgets, `modal__panel--tall` for height
- Footer buttons: always `[Cancelar] [Acción Principal]` aligned right
- Footer uses classes `modal__footer modal-form__footer` (never inline styles)

### Buttons
- **Always rounded corners** (`border-radius: 6-8px`), never square
- Primary (`.btn-primary`): Blue, for main actions (Guardar, Descargar)
- Secondary (`.btn-secondary`): Teal/transparent, for cancel/close, positioned left of primary

### Tables
- Selection: First row selected on load; `is-selected` class for visual state
- Column `ACCIONES` always visible with horizontal button layout
- No horizontal scroll at ≥1280px resolution
- Use `data-pagination="*"` for dynamic pagination

### Design Principles
- Dark theme primary with blue/green accents
- Use CSS variables from `colors.css` (never inline styles)
- Mobile-first responsive design
- Accessibility: Always include `title`/`aria-label` on action buttons

## Environment Setup

Required environment variables in `backend/.env`:
```env
FRONTEND_PORT=3020
BACKEND_PORT=8020
DB_PORT=5452
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=anclora_flow
JWT_SECRET=<your-secret>
NODE_ENV=development
```

Startup flags:
- `SKIP_DB_INIT`: Skip database initialization
- `SKIP_DEV_USER`: Skip automatic dev user creation
- `SEED_DB`: Enable demo data seeding

## Key Files Reference

- **Database schema**: `backend/src/database/init.sql`
- **Seed data**: `backend/src/database/seed-data.sql`
- **Server entry**: `backend/src/server.ts`
- **Frontend entry**: `frontend/src/main.js`
- **Global styles**: `frontend/src/styles/colors.css`
- **Modal guide**: `GUIA_MODALES.md`
- **Table guide**: `GUIA_TABLAS.md`
- **Design guidelines**: `DESIGN_GUIDELINES.md`
