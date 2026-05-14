# Scout Report: BRD and SRS

---
type: scout
date: 2026-05-14
target: brd-and-srs
---

## Summary

Canonical BRD/SRS files are in `docs/vision/`. Both are version `1.1`, dated `2026-05-14`, and are referenced by active migration plans.

## Relevant Files

- `docs/vision/brd.md` - Business Requirements Document for QLNP-TTCDS migration. Covers scope, stakeholders, business requirements, AS-IS/TO-BE process, functional requirements, non-functional requirements, business rules, acceptance criteria, and migration appendices.
- `docs/vision/srs.md` - Software Requirements Specification for QLNP-TTCDS. Covers system overview, role access matrix, functional requirements FR-01 through FR-10, data requirements, security model, validation rules, API contracts, and verification targets.
- `plans/260513-0554-efcore-scaffold-migration/plan.md` - Current completed migration plan. Uses BRD/SRS as source docs and supersedes older Dapper plan. Key final choices: EF Core, scaffold `USER_MASTER` and `DM_DONVI`, API gateway SSO, five QLNP-owned tables.
- `plans/260513-0221-dotnet-migration-refactor/plan.md` - Older pending migration plan. Also references BRD/SRS but differs from the completed plan: Dapper, dual-issuer JWT, employee/department CRUD, standalone login.
- `plans/reports/brd-comparison-report-260512-0950.md` - Comparison of three earlier BRD variants. Useful for understanding why the current BRD combines business traceability with implementation detail.
- `docs/project-overview-pdr.md` - Product overview/PDR with high-level requirement category table.

## Key Findings

- Source of truth appears to be `docs/vision/brd.md` plus `docs/vision/srs.md`.
- Current implementation planning aligns with the newer EF Core scaffold migration plan, not the older Dapper migration plan.
- BRD focuses on business scope and migration rationale: Supabase to .NET 9 + FastEndpoints + VSP + EF Core + SQL Server, iframe/host integration, no QLNP-managed passwords.
- SRS focuses on implementation-verifiable requirements: role matrix, FR-01 to FR-10, data model, auth/security model, validation, and verification notes.
- There are historical contradictions between plans: older plan includes Dapper, employee/department CRUD, standalone login, and dual-issuer JWT; newer completed plan replaces these with EF Core, read-only system tables, gateway SSO, and five QLNP-managed tables.

## Unresolved Questions

- Should the older pending plan be marked superseded/archived everywhere to prevent implementation drift?
- Has the host team finalized gateway headers and iframe postMessage protocol?
- Should `docs/project-overview-pdr.md` be updated to explicitly point to `docs/vision/brd.md` and `docs/vision/srs.md` as canonical specs?
