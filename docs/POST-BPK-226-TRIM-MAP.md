# Post-BPK-226 Trim Map

Status: BPK-229 decision map, no code change.
Date: 2026-06-20

## Purpose

This map separates useful Bluepilot safety surfaces from ceremony after the BPK-226 path. It uses the BPK-228 autonomy reference as the yardstick: the existing soulmatch hard caps, not a new Bluepilot charter.

No file is deleted by this map. No runtime, provider, write, route, env, DB, deploy, or activation behavior is changed.

## Yardstick: 10 Hard Caps

From `soulmatch/docs/AI-AUTONOMY-LAYER-v0.1.md`:

1. Delete files or data.
2. Mutate registry or persistent memory.
3. Push to `main`/`master`.
4. Deploy production.
5. Run automatic multi-model council with cost.
6. Use secrets or change auth.
7. Destructive DB/schema operation.
8. External cost action.
9. Cross-repo write.
10. Use third-party assets with copy/legal risk.

For Bluepilot, a retained gate should protect one of these caps, make a real execution boundary clearer, or provide proof needed by a retained gate.

## Keep

### Activation lock boundary

File: `builder/src/activationLockBoundary.ts`

Why keep: This is the clean central boundary before provider calls, runtime dry-runs, and writes. Its return shape keeps execution flags closed (`providerExecutionAllowed`, `runtimeExecutionAllowed`, `writeExecutionAllowed`, `permitIssueAllowed` all remain `false`) and requires explicit evidence before a later activation task.

Keep shape: one central lock, not a chain of near-duplicate locks.

### Runtime execution decision

File: `builder/src/runtimeExecutionDecision.ts`

Why keep: This is small and concrete. It only allows `dry_run_execution`, blocks write execution into a separate permit authority contract, and bounds runtime duration through `maxRuntimeSeconds`.

Hard caps touched: runtime execution, deploy-adjacent actions, and write separation.

### Maya-core gate evidence bridge

File: `builder/src/mayaCoreGateEnforcementContract.ts`

Why keep: This is a useful bridge to Maya-core gate evidence. It checks configured Maya-core evidence, budget/cost evidence for provider calls, corridor evidence for writes, and operator/provider evidence for runtime.

Limit: This file is still a preflight/evidence bridge. It is not a local emergency stop or local daily budget cap.

### Provider budget and cost gate

Files: `builder/src/providers.ts`, `builder/src/mayaBuilderGateClient.ts`

Why keep: `providers.ts` calls `assertBuilderBudgetGate(...)` before provider calls and records usage with `recordBuilderCost(...)` after responses. The actual budget/cost decision is delegated through `mayaBuilderGateClient.ts` (`assessBudget`, `recordCost`).

Correction: Budget is not absent. What is absent is a simple local Bluepilot-level emergency stop and local daily cap.

### Permit apply write endpoint

File: `builder/src/permitApply.ts`

Why keep: This is a real write/push path (`POST /probe/permit-apply`) that can produce `pushed`, `commitHash`, and `landed`. It validates permit material, rejects the default target repo, rejects unsafe paths, and calls `smartPush(...)`.

Gap: It does not visibly enforce the hard cap "push to `main`/`master`" on the incoming `branch` field.

### Builder safety policy

File: `builder/src/builderSafetyPolicy.ts`

Why keep: It still provides useful path-classification and push-policy reduction (`allow_push`, `dry_run_only`, `manual_only`) for protected paths, auth/deploy paths, dry-run, and approval state.

Limit: It is not a replacement for explicit hard-cap checks at real write/provider/runtime endpoints.

## Align Or Fold

### Autonomy hard-stop lists

Files:

- `builder/src/activationDecisionOperatorMode.ts`
- `builder/src/mayaAutonomyAuthorityIntake.ts`

Current issue: These files use an older generic hard-stop list (`banking`, `financial_transaction`, `illegal_action`, `ethics_charter_violation`, and similar categories). That list is not the BPK-228 canonical 10 hard caps.

Recommended next action: Align these lists to the 10 soulmatch caps or map them explicitly as legacy labels. Do not create a second hard-cap taxonomy.

### Executor mount locks and durable audit receipt store

Files:

- `builder/src/providerCallExecutorMountLock.ts`
- `builder/src/runtimeDryRunExecutorMountLock.ts`
- `builder/src/writeExecutorMountLock.ts`
- `builder/src/durableAuditReceiptStore.ts`

Current issue: These are not obviously wrong, but they duplicate activation-lock language and mostly produce review-ready evidence while keeping side effects false.

Recommended next action: Keep only if a concrete live-review flow consumes their evidence. Otherwise fold them into the central activation-lock proof model.

## Trim Candidates

### Runtime patch permit-consume receipt/audit tower

Pattern:

- `builder/src/runtimePatchPermitConsume*.ts`
- Matching tests under `builder/tests/runtimePatchPermitConsume*.test.ts`

Why trim: The chain appears to encode many receipt/audit/authority steps around runtime patch consume flow while repeatedly keeping execution and durable effects closed. It is not the same as `permitApply.ts`, and it should not be deleted blindly, but it is the strongest ceremony candidate.

Recommended next action: Create a later trim contract that first builds a dependency graph and test impact map, then removes or folds only unused layers. Do not mix this with activation or write changes.

## Build Later: Real Gaps

### Main/master write cap

Target: `builder/src/permitApply.ts`

Problem: The endpoint reads `branch` but does not visibly block `main`/`master`. Hard cap #3 says pushes to `main`/`master` require explicit approval or proof gate even at high autonomy.

Recommended later contract: fail closed for `main`/`master` unless a named proof-gate field is present and tested. Keep it small and endpoint-local.

### Local emergency stop and daily cap

Target: provider/write/runtime entry points, starting with provider calls and `permitApply`.

Problem: Provider calls already use remote Maya budget/cost gates, but Bluepilot lacks a simple local emergency stop and local daily cap that can block immediately before remote calls or writes.

Recommended later contract: add a small local guard layer that can be checked by provider, write, and runtime entry points. It should reuse existing budget/cost evidence where possible and avoid a new governance tower.

## Decision Recommendation

1. Merge BPK-228 before acting on this map, so the canonical autonomy reference is in the build prompt.
2. Review this BPK-229 map as a decision artifact.
3. If approved, build only one small follow-up at a time:
   - BPK-230: `main`/`master` branch cap for `permitApply`.
   - BPK-231: local emergency stop plus daily cap.
   - BPK-232: dependency graph for the runtime patch permit-consume tower before any deletion.

No hidden activation should be bundled with any trim work.
