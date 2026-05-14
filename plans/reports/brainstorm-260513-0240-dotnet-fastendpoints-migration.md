# Brainstorm Report: Migration .NET Minimal API + FastEndpoints

**Date:** 2026-05-13
**Branch:** rebuid-bundle
**Decision:** Approche A — Vertical Slice + FastEndpoints (approuvée)

## Problem

Migration complète du backend : Supabase BaaS → .NET Minimal API + FastEndpoints + SQL Server + JWT Identity. Garder le frontend React.

## Decision

**Vertical Slice + FastEndpoints** — chaque feature = un dossier avec ses endpoints, models, et logique. Pas de Clean Architecture formelle (overkill pour ~25 endpoints).

## Architecture cible

```
React SPA → HTTP REST → .NET 9 Minimal API (FastEndpoints) → EF Core → SQL Server
```

### Endpoints (~25, par feature)

| Feature | Endpoints |
|---------|-----------|
| Auth | POST login, GET me |
| Dashboard | GET dashboard |
| LeaveRequests | POST create, GET list, GET by-id, PUT update, DELETE cancel |
| Approvals | GET pending, POST approve, POST reject |
| Calendar | GET calendar (?month, year, deptId) |
| Summary | GET summary, GET dept-detail |
| Reports | GET reports, GET export-csv |
| Violations | GET violations |
| Config | GET/PUT config, CRUD leave-types, CRUD approval-configs |

### Services partagés
- **LeaveCalculatorService** — business days calculation, overlap detection
- **RoleScopingService** — data filtering CB.PCM→own, LD.PCM→department, GD.PGD/QTHT→all

### Changements DB
- PostgreSQL → SQL Server (uuid→uniqueidentifier, boolean→bit, timestamp→datetime2)
- ASP.NET Core Identity tables (AspNetUsers, AspNetRoles, etc.)

### Changements Frontend
- supabase-js → axios/fetch wrapper
- useStore.login() → JWT auth flow
- Zustand simplifié (cache utilisateur + ref data)

## Risks

| Risk | Mitigation |
|------|------------|
| Migration données PG→SQL | Script export/import avec type mapping |
| Logique métier modifiée | Tests unitaires LeaveCalculator |
| Frontend couplé Supabase | Interface IApiClient pour abstraction |
| Auth interrompue | Test flow JWT séparé avant déploiement |

## Next Steps

1. /ck:plan — plan d'implémentation détaillé avec phases
2. Implémentation phase par phase
3. Tests
4. Migration données + déploiement
