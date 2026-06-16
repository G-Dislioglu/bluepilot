# Activation Lock Boundary Review Packet

## Scope

This bundle adds the next activation layer after live Maya evidence: a provider/runtime/write
activation-lock boundary. It answers whether a target is ready to open a later executor task lock.
It does not execute the target.

## Built

- `GET /probe/activation-lock-contract`
- `POST /probe/activation-lock-preflight`
- Meta entries:
  - `/probe/activation-lock-contract`
  - `/probe/activation-lock-preflight`

## Supported Targets

- `provider_call`
- `runtime_dry_run`
- `write_action`

## Behavior

- Provider-call lock readiness composes the provider/runtime activation preflight with Maya budget
  and cost evidence.
- Runtime dry-run lock readiness composes the provider/runtime activation preflight, Maya
  budget/corridor evidence, operator approval, provider isolation, and runtime bounds.
- Write-action lock readiness composes Maya corridor evidence, operator approval, permit ref,
  target repo ref, target path ref, and content hash ref.

## Safety Boundary

Even when the result is `activation_lock_ready`, the response keeps:

- `providerExecutionAllowed:false`
- `runtimeExecutionAllowed:false`
- `writeExecutionAllowed:false`
- `runtimeRouteMountAllowed:false`
- `permitIssueAllowed:false`

The new route does not call Maya-Core, providers, runtime, DB, GitHub, or any durable writer. It
only evaluates submitted evidence and returns a structured lock decision.

## Evidence

| Check | Result |
| --- | --- |
| Activation lock unit tests | PASS |
| Activation lock route tests | PASS |
| Provider/runtime and Maya route focus tests | PASS |
| Meta focus tests | PASS |
| Focus command | PASS - 22/22 |
| `npm run typecheck` | PASS |
| `node scripts/generate-bpk-governance-manifest.mjs` | PASS - manifest refreshed |
| `node tools/verify-task-lock.cjs ACTIVATION-LOCK-BOUNDARY --verify --contract contracts/ACTIVATION-LOCK-BOUNDARY.json` | PASS - no drift |
| `git diff --check` | PASS |
| `npm test` | PASS - 345/345 |

## Reviewer Focus

Confirm that this is the correct final boundary before any later executor-mount task. A later
activation bundle must still be separate, explicit, and target-specific.
