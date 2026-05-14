# Vertical Slice Architecture + FastEndpoints — Architecture Overview

## What is Vertical Slice Architecture?

Instead of organizing code by technical layer (Controller → Service → Repository), organize by **business feature**. Each feature is a self-contained vertical slice containing everything it needs: request, validation, mapping, business logic, and endpoint.

## What is REPR Pattern?

**R**equest — **E**ndpoint — **R**esponse

One endpoint class handles one request type and returns one response type. No shared controllers with multiple actions.

## What is FastEndpoints?

A .NET library built on top of Minimal APIs that enforces REPR pattern. Provides:
- Endpoint classes with `Configure()` and `HandleAsync()`
- Built-in FluentValidation integration
- Built-in mapper support
- Swagger generation
- Performance on par with Minimal APIs

## CQRS-lite vs Full CQRS

| Aspect | CQRS-lite (this skill) | Full CQRS |
|--------|----------------------|-----------|
| Read/Write separation | Naming convention only | Separate models + DBs |
| Infrastructure | Single database | Separate read/write stores |
| Event Sourcing | None | Required |
| Complexity | Low | High |
| Use case | Most APIs | High-scale, event-driven |

## When to Use This Architecture

✅ API-first applications
✅ Microservices
✅ Small teams (< 5 developers)
✅ Rapid feature development
✅ CRUD-heavy applications
✅ Projects needing clear feature boundaries

❌ Monoliths with complex shared business rules
❌ Teams requiring strict layer separation
❌ Projects needing separate read/write databases
❌ Event Sourcing requirements

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| FastEndpoints | Latest .NET 8 | REPR framework |
| FastEndpoints.Swagger | Latest | Auto Swagger docs |
| FluentValidation | Latest | Request validation |
| FluentValidation.AspNetCore | Latest | ASP.NET integration |

## Performance Note

FastEndpoints benchmarks show performance on par with Minimal APIs and noticeably better than MVC Controllers. Since it's built on Minimal APIs, there's no abstraction penalty.
