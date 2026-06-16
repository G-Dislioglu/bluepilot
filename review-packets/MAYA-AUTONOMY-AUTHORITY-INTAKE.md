# Maya Autonomy Authority Intake Review Packet

## Scope

This bundle adds a side-effect-free Bluepilot intake surface for Maya/Kaya autonomy authority
decisions. Maya/Kaya remains the source of truth. Bluepilot validates and normalizes supplied
decision evidence before activation-decision handoff.

## Built

- `GET /probe/maya-autonomy-authority-contract`
- `POST /probe/maya-autonomy-authority-intake-preflight`
- `/api/meta` advertises both surfaces.
- Valid decisions produce `activationDecisionHandoff.mayaAuthorityDecision`.

## Safety Boundary

The intake validates evidence only. It does not call Maya/Kaya live, call providers, execute runtime,
write files/GitHub/database, persist receipts, issue permits, merge, or deploy.

## Evidence

| Check | Result |
| --- | --- |
| Focus tests | PASS - 11/11 |
| `npm run typecheck` | PASS |
| `verify-task-lock` | PASS - kein Drift |
| `git diff --check` | PASS |
| Full builder test | PASS - 391/391 |

## Reviewer Focus

Confirm that Bluepilot stays a consumer and executor guard. The intake should fail closed for
missing, expired, mismatched, or hard-stop-policy-incomplete Maya/Kaya decisions.
