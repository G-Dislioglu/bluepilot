# Maya Autonomy Delegation Consumer Review Packet

## Scope

This bundle reframes Bluepilot as a consumer of Maya/Kaya autonomy decisions. Maya/Kaya is the
cross-app source of truth for user autonomy and full-access grants. Bluepilot keeps local executor
locks and hard-stop guardrails.

## Built

- `activationDecisionOperatorMode` now requires `mayaAuthorityDecision` for execution modes.
- Contract metadata names Maya/Kaya as `sourceOfTruth`.
- Full access carries forward only from a ready Maya/Kaya authority decision.

## Safety Boundary

This bundle does not call Maya/Kaya live. It validates supplied decision evidence only. It does not
call providers, execute runtime, write files/GitHub/database, persist receipts, issue permits,
merge, or deploy.

## Evidence

| Check | Result |
| --- | --- |
| Focus tests | PASS - 12/12 |
| `npm run typecheck` | PASS |
| `verify-task-lock` | PASS - kein Drift |
| `git diff --check` | PASS |
| Full builder test | PASS - 383/383 |

## Reviewer Focus

Confirm that Bluepilot no longer owns the canonical autonomy grant. It consumes Maya/Kaya decisions
and still blocks banking, finance, ethics-charter violations, and other hard stops locally.
