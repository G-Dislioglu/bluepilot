# Runtime Patch Permit-Consume Dependency Map

Status: BPK-232 dependency map, no deletion.
Date: 2026-06-20

## Purpose

This map checks whether the runtime patch permit-consume tower is connected to live
Bluepilot runtime paths before any trim task deletes files.

No source file, test, route, env, DB, deploy, provider, write, runtime, or activation
behavior is changed by this map.

## Scope Checked

The checked cluster contains the runtime-server-patch start, operator dry-run evidence,
permit issue, permit consume, execution receipt, and receipt/audit tail.

Measured from the local `origin/main` baseline `58752e5`:

- Source files: 41
- Source lines: 5961
- Direct matching tests: 41
- Test lines: 3351
- External source importers: 0
- External test importers: 0
- `builder/src/server.ts` route mounts for `runtimePatch*` / `runtimeServerPatch*`: 0
- `builder/data/bpk-governance-manifest.json` refs for the cluster: 0

Important distinction: this cluster is not `builder/src/permitApply.ts`. `permitApply`
is the real write path and is retained; BPK-230 and BPK-231 already added hard-cap
guards there.

## Cluster Files

### Start And Operator Review

- `builder/src/runtimeServerPatchCandidate.ts`
- `builder/src/runtimeServerPatchApplicationReadiness.ts`
- `builder/src/runtimeServerPatchOperatorDryRun.ts`
- `builder/src/runtimePatchOperatorDryRunEvidence.ts`
- `builder/src/runtimePatchOperatorDecisionGate.ts`
- `builder/src/runtimePatchApprovedActionPermitPrep.ts`
- `builder/src/runtimePatchPermitPrepEvidence.ts`
- `builder/src/runtimePatchPermitIssuanceReadiness.ts`
- `builder/src/runtimePatchPermitIssuanceRequestPacket.ts`
- `builder/src/runtimePatchAuthorityReviewIntake.ts`
- `builder/src/runtimePatchAuthorityReviewDecisionGate.ts`
- `builder/src/runtimePatchPermitIssuePreflight.ts`
- `builder/src/runtimePatchPermitIssueAuthority.ts`

### Permit Consume Chain

- `builder/src/runtimePatchPermitConsumePreflight.ts`
- `builder/src/runtimePatchPermitConsumeAuthority.ts`
- `builder/src/runtimePatchPermitConsumeApplicationPreflight.ts`
- `builder/src/runtimePatchPermitConsumeApplicationAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecord.ts`

### Receipt And Audit Tail

- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAudit.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceipt.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.ts`
- `builder/src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority.ts`

## Import Findings

The source cluster is closed: every source import of these files comes from another
file in the same cluster. No non-cluster `builder/src/*.ts` file imports these modules.

The tests are also closed: every direct matching test imports a cluster file, and no
non-cluster `builder/tests/*.ts` file imports a cluster module.

## Route Findings

`builder/src/server.ts` has no dispatch for the cluster. The live server still mounts
other retained runtime/write surfaces such as runtime dry-run routes, provider runtime
activation, activation locks, and `permitApply`, but it does not mount a
`runtimePatchPermit*` or `runtimeServerPatch*` endpoint from this cluster.

This means the cluster is not reachable over the current HTTP server.

## Historical References

There are historical references in `docs/CLAUDE-CONTEXT.md`, `docs/SESSION-LOG.md`,
older `contracts/BPK-*.json`, and older `review-packets/BPK-*.md`. These describe how
the tower was built. They are not live runtime imports or route mounts.

Any deletion task should decide explicitly whether to leave historical contracts as
audit history or to add a small "trimmed by BPK-233" note in current anchors.

## Decision

This map supports the conclusion that the runtime patch permit-consume tower is a trim
candidate:

- It is not mounted in the live server.
- It has no external source importers.
- It has no external test importers.
- It is separate from the retained `permitApply` write path.

This map does not delete anything. A deletion is a separate human-approved task because
it removes source and tests.

## Recommended Next Task

BPK-233 should be the first actual trim task if approved by the human operator.

Recommended BPK-233 guardrails:

- Delete only the 41 cluster source files and their 41 direct tests.
- Do not touch `permitApply`, `builderSafetyPolicy`, `localSafetyGuard`, providers,
  activation locks, runtime dry-run routes, deploy, env, DB, packages, or workflows.
- Check `builder/data/bpk-governance-manifest.json` for stale refs before and after.
- Run `npm run typecheck`.
- Run full `npm test`.
- Run `node tools/verify-task-lock.cjs BPK-233 --verify`.
- Run `git diff --check --cached`.

If typecheck or full tests reveal a hidden dependency, stop and report the exact import
or failing test instead of broadening the deletion.
