# Project Rules

## Pre-Task Requirements (MANDATORY)

- These documents are the source of truth for scope, acceptance criteria, and business rules. Do not implement without consulting them.

## Post-Task Requirements (MANDATORY)

- **MUST update task progress** in `docs/vision/tasks.md` after completing each task — mark checkboxes `[x]`, update status tables, add notes if needed.
- This applies to every Day's checklist items, checklist nghiệm thu, and action items.
- Progress tracking in `tasks.md` is the single source of truth for migration status. Keep it current.

## EF Core Migrations (MANDATORY)

- **ALWAYS use EF Core CLI tools** (`dotnet ef migrations add`, `dotnet ef migrations remove`, `dotnet ef database update`) for migration operations.
- **NEVER manually edit files** in `*/Data/Migrations/` directory — regenerate via `dotnet ef migrations remove` then `dotnet ef migrations add` if changes needed.
- **NEVER manually create migration files** — always scaffold through tooling to ensure snapshot consistency.

## Git Commit Flow (MANDATORY)

- **NEVER commit directly to `dev` or `main`**.
- Commit flow: `branch → PR → dev → PR → main`
- Always create a feature branch before any code change.

## Use Case Checklist (MANDATORY)

- **MUST update `docs/usecase/usecase-checklist.md`** after every code change that affects a use case feature.
- Check `[x]` completed items, update progress counts and percentages.
- Cross-cutting concerns (audit log, `/leave/history`, backend APIs) affect multiple UCs — update all relevant sections.
- Use the checklist to preview progress per UC before planning next work.

## Testing (MANDATORY)

- **NEVER write tests** — testing is delegated to the `tester` agent.
