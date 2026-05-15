# Project Rules

## Pre-Task Requirements (MANDATORY)

- **MUST read BRD** (`docs/vision/brd.md`) before implementing any feature/task — ensures alignment with business requirements (BR-001→BR-006, AC-001→AC-016).
- **MUST read SRS** (`docs/vision/srs.md`) before implementing any feature/task — ensures compliance with functional requirements (FR-01→FR-10).
- These documents are the source of truth for scope, acceptance criteria, and business rules. Do not implement without consulting them.

## Post-Task Requirements (MANDATORY)

- **MUST update task progress** in `docs/vision/tasks.md` after completing each task — mark checkboxes `[x]`, update status tables, add notes if needed.
- This applies to every Day's checklist items, checklist nghiệm thu, and action items.
- Progress tracking in `tasks.md` is the single source of truth for migration status. Keep it current.

## Git Commit Flow (MANDATORY)

- **NEVER commit directly to `dev` or `main`**.
- Commit flow: `branch → PR → dev → PR → main`
- Always create a feature branch before any code change.
