# Provider/Runtime Activation Preflight Review Packet

## Scope

This bundle adds a contract-only preflight for provider-call and runtime-dry-run activation review based on Maya-Core gate evidence.

## Built

- `GET /probe/provider-runtime-activation-contract` describes the closed activation boundary.
- `POST /probe/provider-runtime-activation-preflight` dry-validates provider and runtime evidence.
- The preflight composes the Maya-Core gate enforcement preflight with runtime execution decision checks.
- The eight-point readiness model now marks `provider_runtime_flows` as `wired_contract_only`.
- The operator dashboard shows Provider and Runtime Flows as a contract-only panel.

## Safety Notes

- No provider call is made.
- No runtime is executed.
- No runtime route is mounted or enabled.
- The new route does not call Maya-Core; it only evaluates provided evidence.
- No DB, GitHub, file write, permit issue, deploy, or merge is performed.

## Evidence

| Command | Result |
| --- | --- |
| `npx tsx --test tests/providerRuntimeActivationPreflight.test.ts tests/providerRuntimeActivationRoute.test.ts tests/eightPointIntegrationReadiness.test.ts tests/meta.test.ts tests/operatorDashboardHtml.test.ts` | PASS - 15/15 |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm test` | PASS - 329/329 |

## Reviewer Focus

Confirm that provider/runtime activation is still only review-preflight state: `providerActivationAllowed:false`, `runtimeActivationAllowed:false`, `dryRunRouteMountAllowed:false`, and all side effects remain false.
