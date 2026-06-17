# Review Packet - WIRE-SCAN-002

## Scope

Harden `tools/orphan-scan.cjs` so verification can inspect the orphan census without hidden
file writes.

## Changes

- Added explicit scanner modes:
  - `--check`: render census in-memory, compare with `docs/ORPHAN-CENSUS-v0.1.md`, write nothing.
  - `--write`: intentionally regenerate `docs/ORPHAN-CENSUS-v0.1.md`.
  - no args: read-only check, same as `--check`.
- Added CLI usage handling for unknown arguments.
- Added `tools/orphan-scan-mode.test.cjs` with temporary fixture coverage for write/check,
  default read-only behavior, stale report failure without mutation, and unknown mode failure.
- Refreshed `docs/ORPHAN-CENSUS-v0.1.md` to the current WIRE-SLICE-001 state.
- Updated `docs/CLAUDE-CONTEXT.md`, `docs/SESSION-LOG.md`, and `STATE.md`.

## Census Delta

- Scanned modules: 303 -> 304.
- Non-live modules: 221 -> 222.
- CONNECT: 15 -> 17.
- KEEP_STAGED: 117 -> 116.
- `dispatchDryRunSlice.ts` appears as staged/test-only.
- The dry-run dispatch chain now records `dispatchDryRunSlice.ts` as a used value importer for
  the relevant non-live modules.

## Safety

- No `builder/src/**` or `builder/tests/**` files changed.
- No orphan connectivity semantics changed.
- `verify-task-lock.cjs` behavior was not changed.
- The scanner no longer mutates the report during default verification use.

## Verification

- `node --test tools/orphan-scan-mode.test.cjs`
- `node tools/orphan-scan.cjs --check`
- `node tools/verify-task-lock.cjs WIRE-SCAN-002 --verify`
- `git diff --check`
