## Code Review Summary

### Scope
- Files: ~85 files in `packages/web`
- LOC: Large scale migration
- Focus: Tailwind CSS prefix migration to `lma-`
- Scout findings: Systemic miss of certain utility classes (e.g., `shrink-0`, `grow-0`, `basis-full`, `min-w-0`) across multiple files.

### Overall Assessment
**NOT READY FOR PRODUCTION**. While the core configuration is correct, the actual migration of classes in source files is incomplete. A systemic set of utility classes were missed, which will result in broken layouts and styles in production.

### Critical Issues
- **Incomplete Migration**: Multiple files contain unprefixed Tailwind classes. Examples found:
  - `src/shared/ui/carousel.tsx`: `min-w-0`, `shrink-0`, `grow-0`, `basis-full` are unprefixed.
  - `src/shared/ui/sidebar.tsx`, `src/shared/ui/button.tsx`, `src/shared/ui/avatar.tsx`, etc.: `shrink-0` is unprefixed.
  - `src/features/layout/components/app-header.tsx`: `shrink-0` is unprefixed.
- **Linting Gap**: `eslint-plugin-tailwindcss` is configured with the prefix but did not flag these missing prefixes during `npm run lint`. This removes a critical safety net.

### High Priority
- **Consistency**: The prefixing is inconsistent across the UI library components.

### Medium Priority
- None

### Low Priority
- None

### Edge Cases Found by Scout
- **Utility Class Patterns**: The migration script likely relied on patterns that missed classes like `shrink-0` or `grow-0`, possibly because they are less common or didn't match the expected regex.
- **Shorthand/Compound Classes**: Classes like `min-w-0` were also missed.

### Positive Observations
- `cn()` utility in `src/shared/lib/utils.ts` is correctly updated using `extendTailwindMerge({ prefix: "lma-" })`.
- `tailwind.config.ts` is correctly configured with `prefix: "lma-"`.
- `eslint.config.js` is correctly configured with `prefix: "lma-"`.
- CSS files using `@apply` directives have been correctly updated.

### Recommended Actions
1. **Fix Missing Prefixes**: Use a more robust search/replace or a corrected migration script to find and prefix all remaining Tailwind classes. Specifically target:
   - `shrink-0` $\rightarrow$ `lma-shrink-0`
   - `grow-0` $\rightarrow$ `lma-grow-0`
   - `grow` $\rightarrow$ `lma-grow`
   - `basis-full` $\rightarrow$ `lma-basis-full`
   - `min-w-0` $\rightarrow$ `lma-min-w-0`
   - And any others identified by `grep`.
2. **Audit ESLint Config**: Investigate why `eslint-plugin-tailwindcss` is not flagging unprefixed classes. Ensure the rules are actually active and targeting the correct files.
3. **Full Grep Audit**: Run a comprehensive grep for all common Tailwind prefixes that *don't* start with `lma-` before shipping.

### Metrics
- Type Coverage: N/A (Style change)
- Test Coverage: N/A (Style change)
- Linting Issues: 15 (but none related to Tailwind prefix, which is the core problem)

### Unresolved Questions
- Why did the migration script miss these specific classes?
- Why is the Tailwind ESLint plugin not flagging these?
