---
name: vertical-slice-fastendpoints
description: "Design and implement .NET APIs using Vertical Slice Architecture with FastEndpoints and REPR Pattern. Use when user wants to structure a .NET project by feature slices, implement REPR (Request-Endpoint-Response) pattern, set up FastEndpoints in .NET 8, organize code by business domain instead of layers, or apply CQRS-lite naming conventions. Triggers: vertical slice, REPR, FastEndpoints, feature-based folder structure, .NET API architecture, endpoint-per-class, CQRS-lite."
version: "1.0.0"
---

# Vertical Slice Architecture + FastEndpoints Skill

## Purpose

Design and scaffold .NET 8 APIs using Vertical Slice Architecture with FastEndpoints library and REPR Pattern. Produces feature-based folder structures, endpoint scaffolds, and CQRS-lite naming conventions.

## Scope

This skill handles:

- Designing Vertical Slice folder structures for .NET APIs
- Scaffolding FastEndpoints with REPR pattern (Request, Endpoint, Response, Mapper, Validator)
- CQRS-lite naming conventions (Get* = Query, Save/Publish/Approve* = Command)
- Program.cs wiring for FastEndpoints + Swagger
- FluentValidation integration within Request models

Does NOT handle:

- Database/ORM implementation (Data layer)
- Authentication/OAuth setup
- Event Sourcing or full CQRS infrastructure
- Frontend or non-.NET projects

## When to Use

- User asks to structure/scaffold a .NET API by features
- User mentions Vertical Slice, REPR, FastEndpoints
- User wants to migrate from layered/controller architecture to feature-based
- User wants folder structure for a domain (e.g., "model Medium.com")

## Workflow

### Step 1: Identify Domain Entities

Extract business entities from user's description. Ask if ambiguous.

Example: Medium.com → Admin, Author, Reader, Stats

### Step 2: List Features per Entity

For each entity, list Commands (write) and Queries (read):

- Commands: Save*, Publish*, Approve*, Deny*, Create*, Delete*
- Queries: Get*, List*, Search\*

Ask user to confirm or adjust scope.

### Step 3: Generate Folder Structure

```txt
{ProjectName}/
├── {Entity1}/
│   ├── {Feature1}/
│   │   ├── Endpoint.cs
│   │   ├── Models.cs      (Request, Response, Validator)
│   │   ├── Mapper.cs
│   │   └── Data.cs
│   └── {Feature2}/
│       └── ...
├── {Entity2}/
│   └── ...
└── Program.cs
```

### Step 4: Scaffold Each Endpoint

Each endpoint folder contains 4 files. Use templates from `references/endpoint-templates.md`.

### Step 5: Wire Up Program.cs

```csharp
using FastEndpoints;
using FastEndpoints.Swagger;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddFastEndpoints();
builder.Services.SwaggerDocument();

var app = builder.Build();
app.UseFastEndpoints();
app.UseSwaggerGen();
app.Run();
```

### Step 6: Add NuGet Packages

```bash
dotnet add package FastEndpoints
dotnet add package FastEndpoints.Swagger
dotnet add package FluentValidation
dotnet add package FluentValidation.AspNetCore
```

## Key Principles

1. **1 endpoint = 1 class = 1 feature** — no shared controllers
2. **Feature folder is self-contained** — all files for 1 feature in 1 folder
3. **CQRS-lite naming** — `Get*` = Query, `Save/Publish/Approve*` = Command (no separate infrastructure)
4. **Validation in Request** — FluentValidation rules live inside the Request model's Validator class
5. **Mapper isolates DTO↔Entity** — no AutoMapper, explicit mapping per endpoint
6. **No cross-slice dependencies** — each slice owns its logic end-to-end

## Architecture Comparison

| Aspect       | Layered/Controller     | Vertical Slice + REPR       |
| ------------ | ---------------------- | --------------------------- |
| Organization | By technical layer     | By business feature         |
| Endpoint     | Many actions per class | 1 action per class          |
| Validation   | Filters/attributes     | FluentValidation in Request |
| Navigation   | Jump across 3-4 files  | All in 1 folder             |
| Coupling     | Shared services        | Self-contained slice        |
| Scaling      | Touch multiple layers  | Modify 1 folder             |

## Reference Files

- `references/endpoint-templates.md` — Full code templates for Request, Validator, Response, Mapper, Endpoint, Data
- `references/naming-conventions.md` — CQRS-lite naming rules and feature organization patterns
