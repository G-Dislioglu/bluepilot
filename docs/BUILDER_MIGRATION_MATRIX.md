# Builder Migration Matrix

Date: 2026-05-31
Status: planning anchor for staged migration

This document records the corrected Builder migration map after comparing Claude output with
the local soulmatch and Bluepilot repositories.

Important rule: "not Tier 1" does not mean "dead." Several Tier 2 paths are live and must be
moved later only if Bluepilot needs that capability.

## Tiers

- Tier 1 - first migration core: the smallest route-backed TypeScript Builder path to make
  Bluepilot capable of running a bounded build flow.
- Tier 2 - live later modules: specialized or operator paths such as feature planning, swarm,
  decompose, patrol, director, dialog, and worktree execution.
- Tier 3 - legacy candidates: old controller-line code not used by the current canonical route.

## Route To Module Matrix

| Route or caller | Calls | Main modules | Tier | Migration decision |
| --- | --- | --- | --- | --- |
| `/api/builder/opus-bridge/opus-task` | `orchestrateTask` | `opusTaskOrchestrator` | 1 | first core block |
| `/api/builder/opus-bridge/execute` | `orchestrateTask` with legacy response shape | `opusTaskOrchestrator` | 1 | keep compatibility later if needed |
| `/api/builder/opus-bridge/build` | `runBuildPipeline` | `opusBuildPipeline` wrapper around `opusTaskOrchestrator` | 1 | first core block if `/build` stays supported |
| `opusTaskOrchestrator` internals | scope, related files, hardening, architect assembly, worker calls, judge, safety, smart push | import closure listed below | 1 | migrate as verified closure, not as hand-picked file list |
| `/api/builder/opus-bridge/opus-feature` | `orchestrateFeature` -> `runVordenker` + `runMeisterPlan` + `orchestrateTask` | `opusFeatureOrchestrator`, `opusVordenker`, `opusMeisterPlan` | 2 | later feature-planning block |
| `/api/builder/opus-bridge/swarm` | `runWorkerSwarm` | `opusWorkerSwarm` | 2 | later swarm block |
| `/api/builder/opus-bridge/decompose` | `decompose` | `opusDecomposer` | 2 | later decompose block |
| `/api/builder/patrol` and `/api/builder/opus-bridge/patrol-*` | patrol router and patrol runners | `scoutPatrol`, `patrolRepairLoop` | 2 | later patrol block |
| `/api/builder/maya/director` | director actions and prompt/context | `directorActions`, `directorContext`, `directorPrompt` | 2 | later director block |
| builder task run / prototype lanes | `runDialogEngine` | `builderDialogEngine`, `builderExecutor`, `builderPatchExecutor`, `builderFileIO` | 2 | later dialog/worktree write-path block |
| old direct controller line | `executeTask` | `opusBridgeController` | 3 | leave behind unless a later audit proves needed |
| old controller council path | `runRoundtable` | `opusRoundtable` | 3 | leave with old controller line |
| old controller scout path | `runScoutPhase` | `opusScoutRunner` | 3 | leave with old controller line |

## Tier 1 Import Closure

The first core cannot be migrated by moving only the headline modules. Before any module move,
the dependency closure must be machine-checked from these entrypoints:

- `server/src/lib/opusTaskOrchestrator.ts`
- `server/src/lib/opusBuildPipeline.ts`

Directly observed required modules include:

- `opusTaskOrchestrator`
- `opusBuildPipeline`
- `providers`
- `opusAssist`
- `opusWorkerRegistry`
- `builderScopeResolver`
- `builderRelatedFiles`
- `opusChangeRouter`
- `opusJudge`
- `opusClaimGate`
- `opusSmartPush`
- `opusPatchMode`
- `opusBridgeConfig`
- `pushResultWaiter`
- `outboundHttp`
- `opusEnvelopeValidator`
- `builderSafetyPolicy`
- `builderApprovalArtifacts`
- `specHardening`
- `architectPhase1`
- `builderControlPlane`
- `builderSideEffects`
- `builderWorkflowSimulation`
- `builderRecommendationOutput`
- `builderAnalysisOutput`
- `builderTargetProfiles`
- `opusRenderBridge`
- `opusSelfTest`
- `opusErrorLearning`
- `devLogger` replacement or local equivalent

Database-backed pieces must be treated as a separate sub-step:

- `builderApprovalArtifacts` depends on Builder artifact storage.
- `opusErrorLearning` depends on Builder error-card storage.
- `architectPhase1` depends on Builder assumptions storage.
- `poolState` is not in the direct first-route list above, but worker/provider selection later
  intersects with pool state and should be audited before live provider use.

## Test Baseline

Soulmatch branch `builder/test-baseline` established `npm run test:builder` and measured the
current broad Builder baseline:

- 22 tests passed.
- 0 tests failed.

That baseline is useful as a broad "before" signal, but it is not a pure Tier-1 test set. It
also covers Tier 2 or side capabilities such as council debate, GOAT, and kill-switch helpers.
Future migration blocks should split tests by tier.

## First Implementation Step

BP-126 creates only the TypeScript home under `builder/`.

No soulmatch Builder module moves in BP-126.
