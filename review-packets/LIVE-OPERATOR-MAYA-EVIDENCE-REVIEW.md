# Live Operator Maya Evidence Review Packet

## Scope

This bundle records live Render evidence after the operator opened
`BLUEPILOT_OPERATOR_READ_ONLY_ROUTE_ENABLED=true`. It reviews the read-only operator dashboard and
the Maya-gated activation preflights without enabling provider calls, runtime execution, writes,
permit issuance, merges, deploys, or durable persistence.

## Live Target

- Service: `https://bluepilot-builder.onrender.com`
- Live commit: `7a7fb3cd960f5bee3f37b37d3afa42f3c75fc41d`
- Live branch: `main`
- BPK path: `226/226`, `knownPathComplete:true`
- Dashboard route: `GET /cockpit/operator-read-only`
- Evidence date: `2026-06-15`

## Operator Dashboard Evidence

- Desktop screenshot: `builder/output/live-review/operator-dashboard-live-desktop.png`
- Mobile screenshot: `builder/output/live-review/operator-dashboard-live-mobile.png`
- Desktop layout measurement: PASS - 8 panels, statuses `wired read only` and
  `wired contract only`, overlaps `[]`, scrollWidth 1280, clientWidth 1280.
- Mobile layout measurement: PASS - 8 panels, statuses `wired read only` and
  `wired contract only`, overlaps `[]`, scrollWidth 390, clientWidth 390.
- Console inspection: PASS with note - only `/favicon.ico` returned 404, non-blocking.

Rendered live panels:

- BPK Execution Ledger
- Patrol Visual Coverage
- Repo Mutation Kill Switch
- AICOS Permission Review
- GOAT Desktop Bridge
- Maya-Core Gate Enforcement
- Provider and Runtime Flows
- Merge and Release Readiness

## Maya-Gate Live Evidence

`GET /health/maya-gate` returned HTTP 200:

- `mayaCoreConfigured:true`
- Budget gate: `reachable:true`, `status:"reachable"`, `reason:"under_threshold"`
- Corridor gate: `reachable:true`, `status:"reachable"`, `reason:"dry_run_allowed"`
- Cost gate: `reachable:true`, `status:"reachable"`, `recorded:true`, `reason:"recorded"`

`GET /probe/maya-core-gate-enforcement` returned HTTP 200 and confirmed the activation boundary:

- `callsMayaCore:false`
- `callsProviders:false`
- `executesRuntime:false`
- `writesFiles:false`
- `writesDatabase:false`
- `createsPermits:false`

## Live Preflight Evidence

Maya-core enforcement preflights:

- `provider_call`: PASS - `ready_for_activation_review`, blockers `[]`, sideEffects all false.
- `runtime_execution`: PASS - `ready_for_activation_review`, blockers `[]`, sideEffects all false.
- `write_action`: PASS - `ready_for_activation_review`, blockers `[]`, sideEffects all false.

Provider/runtime activation preflights:

- `provider_call`: PASS - `ready_for_activation_review`, blockers `[]`,
  `providerActivationAllowed:false`, `runtimeActivationAllowed:false`,
  `dryRunRouteMountAllowed:false`, sideEffects all false.
- `runtime_dry_run`: PASS - `ready_for_activation_review`, blockers `[]`,
  `providerActivationAllowed:false`, `runtimeActivationAllowed:false`,
  `dryRunRouteMountAllowed:false`, sideEffects all false.
- Nested runtime decision for `runtime_dry_run`: `status:"ready"` and
  `runtimeExecutionAllowed:true` only inside the dry decision object; the live activation preflight
  still keeps runtime execution and route mount closed.

## Safety Notes

- No implementation code was changed by this review bundle.
- No provider was called.
- No runtime was executed.
- No runtime execution route was opened.
- No file, DB, GitHub, receipt, or permit write was performed by the application.
- No merge or deploy was performed by the application.
- The dashboard is now live because the operator opened the explicit Render env gate; it remains a
  read-only operator surface.

## Evidence Commands

| Check | Result |
| --- | --- |
| `GET /api/meta` | PASS - live `main` commit `7a7fb3c`, BPK `226/226` |
| `GET /cockpit/operator-read-only` | PASS - route rendered live after env gate |
| Desktop Playwright screenshot/layout | PASS |
| Mobile Playwright screenshot/layout | PASS |
| `GET /health/maya-gate` | PASS |
| `GET /probe/maya-core-gate-enforcement` | PASS |
| `POST /probe/maya-core-gate-enforcement-preflight` | PASS for provider/runtime/write evidence |
| `POST /probe/provider-runtime-activation-preflight` | PASS for provider/runtime activation review |

## Reviewer Focus

Confirm that the live dashboard is acceptable as a read-only operator review surface and that the
Maya-gated activation evidence is sufficient for a later, separate activation decision. This packet
does not approve opening provider calls, runtime execution, writes, merges, or deploy automation.
