# BRD & SRS alignment with 7 use cases

**Date**: 2026-05-20 15:40
**Severity**: Medium
**Component**: Vision docs (BRD, SRS)
**Status**: Resolved

## What Happened

Updated BRD and SRS to reflect 7 real-world use cases from `docs/usecase/usecase.md`. Gap analysis found 8 discrepancies between what the docs specified and what users actually do.

## The Real Pain

The BRD and SRS were written top-down without validating against actual workflows. Eight gaps surfaced. The worst: the docs assumed "manager approves then done" but the real flow has LĐ.PCM editing pending requests, approvers updating fields during approval, and soft-cancel instead of delete. Had we coded from the original docs, we'd be rewriting core logic in sprint 3.

## Key Decisions

- **Soft-cancel** over hard-delete — data integrity matters more than schema purity
- **LĐ.PCM can edit pending requests** — real workflow demands it, auth gates adjusted accordingly
- **Approver updates logged** — every field change during approval goes to audit trail
- **Excel export with formatting** — users need usable output, not raw CSV

## Next Steps

None. Docs are now consistent with use cases. Any new feature must trace back to a use case first.
