# Maya-Core Autonomy Verification Dashboard Review Packet

## Scope

This bundle prepares Bluepilot for Maya-core authority verification and exposes Maya/Kaya authority
status in the operator dashboard.

## Built

- `GET /probe/maya-core-autonomy-verification-contract`
- `POST /probe/maya-core-autonomy-verification-preflight`
- `/api/meta` advertises both surfaces.
- Operator Dashboard shows `Maya/Kaya Authority Status` and a copy-only `Maya Authority Verify`
  control.

## Safety Boundary

The preflight plans a verify request only. It does not call Maya/Kaya live, call providers, execute
runtime, write files/GitHub/database, persist receipts, issue permits, merge, or deploy.

## Evidence

| Check | Result |
| --- | --- |
| Focus tests | PASS - 18/18 |
| `npm run typecheck` | PASS |
| `verify-task-lock` | PASS - kein Drift |
| `git diff --check` | PASS |
| Full builder test | PASS - 397/397 |
