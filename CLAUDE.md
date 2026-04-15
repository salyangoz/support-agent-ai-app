# Support AI Agent - Frontend Dashboard

## Overview
Frontend for the Support AI Agent backend (`../support-ai-agent/`). Multi-tenant dashboard where tenants register, login, and manage their AI support agent configuration.

## Tech Stack
- **Runtime**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 with design tokens
- **Routing**: React Router v7
- **State**: TanStack Query (server state) + React Context (auth state)
- **HTTP**: Axios with JWT interceptors
- **Icons**: Lucide React
- **UI**: Custom components inspired by shadcn/ui patterns

## Project Structure
```
src/
  components/
    ui/         # Reusable UI primitives (Button, Input, Card, Badge, etc.)
    layout/     # Layout components (Sidebar, Header, DashboardLayout)
  context/      # React context providers (auth-context)
  hooks/        # Custom hooks
  lib/          # Utilities (api client, design-tokens, cn helper)
  pages/
    auth/       # Login, Register
    dashboard/  # All authenticated pages (apps, tickets, knowledge, etc.)
  types/        # TypeScript types mirroring backend models
```

## Design Token System
- **Source of truth**: `src/lib/design-tokens.ts` (JS values for charts, dynamic styles)
- **CSS mapping**: `src/index.css` (Tailwind @theme block)
- Keep both in sync when updating tokens.
- All semantic colors (state, draft status, roles, app brands) live in tokens.
- Use `tokens.colors.*` for JS-side dynamic styling.
- Use `text-brand-600`, `bg-state-open`, etc. for Tailwind classes.

## Conventions
1. **API proxy**: Dev server proxies `/api/*` → `http://localhost:3001/*` (strips `/api` prefix)
2. **Path alias**: `@/` maps to `src/`
3. **Routing**: `/t/:tenantId/*` for all tenant-scoped pages
4. **Auth**: JWT stored in localStorage, auto-refresh on 401
5. **API responses**: Backend uses snake_case — types mirror that
6. **Components**: Keep UI primitives in `components/ui/`, compose in pages
7. **Queries**: Use TanStack Query with `['resource', tenantId, ...filters]` key patterns

## Commands
```bash
npm run dev      # Start dev server on port 5173
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Backend API
See `../support-ai-agent/API.md` and `../support-ai-agent/docs/openapi.yaml` for full API docs.
Backend runs on port 3001 by default.
