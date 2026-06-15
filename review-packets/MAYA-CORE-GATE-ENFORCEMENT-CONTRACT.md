# Maya-Core Gate Enforcement Contract Review Packet

## Scope

This bundle adds a Bluepilot contract-only enforcement surface for Maya-Core gate evidence before provider calls, write actions, or runtime execution can be reviewed for activation.

## Built

- `GET /probe/maya-core-gate-enforcement` describes required evidence for protected targets.
- `POST /probe/maya-core-gate-enforcement-preflight` dry-validates submitted gate evidence.
- The eight-point readiness model now marks `maya_core_gate_enforcement` as `wired_contract_only`.
- The operator dashboard shows Maya-Core Gate Enforcement as a contract-only panel.

## Safety Notes

- The new preflight route does not call Maya-Core; live reachability remains isolated in `/health/maya-gate`.
- No provider call, runtime execution, file write, DB write, GitHub action, permit issue, deploy, or merge is performed.
- Missing or unreachable gate evidence blocks activation review.

## Evidence

| Command | Result |
| --- | --- |
| `npx tsx --test tests/mayaCoreGateEnforcementContract.test.ts tests/mayaCoreGateEnforcementRoute.test.ts tests/eightPointIntegrationReadiness.test.ts tests/meta.test.ts tests/operatorDashboardHtml.test.ts` | PASS - 15/15 |
| `npm run typecheck` | PASS |
| `git diff --check` | PASS |
| `npm test` | PASS - 321/321 |

## Reviewer Focus

Confirm that this is only an evidence/preflight integration and that provider calls, writes, runtime execution, Maya-Core calls from the new preflight, permits, deploys, and merges remain closed.
