import assert from 'node:assert/strict';

import { buildRuntimePatchOperatorDryRunEvidence } from '../src/runtimePatchOperatorDryRunEvidence.js';
import type { RuntimeServerPatchOperatorDryRun } from '../src/runtimeServerPatchOperatorDryRun.js';

const dryRun: RuntimeServerPatchOperatorDryRun = {
  status: 'ready',
  dryRunAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  dryRunRef: 'dry-run:runtime-patch',
  operatorRef: 'operator:runtime',
  simulationRef: 'simulation:runtime-patch',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  simulatedSteps: ['verify_execution_closed_ref', 'stop_before_any_server_route_or_execution_mutation'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRuntimeDryRunEvidence(): void {
  const evidence = buildRuntimePatchOperatorDryRunEvidence({
    dryRun,
    evidenceRef: 'evidence:runtime-dry-run',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-073.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.patchApplyAllowed, false);
  assert.equal(evidence.executionAllowed, false);
  assert.ok(evidence.simulatedSteps.includes('stop_before_any_server_route_or_execution_mutation'));
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildRuntimePatchOperatorDryRunEvidence({
    dryRun,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-073.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('runtime_patch_dry_run_evidence.evidence_ref_required'));
}

function testBlockedDryRunBlocksEvidence(): void {
  const evidence = buildRuntimePatchOperatorDryRunEvidence({
    dryRun: {
      ...dryRun,
      status: 'blocked',
      dryRunAllowed: false,
      blockers: ['runtime_patch_operator_dry_run.readiness_not_allowed'],
    },
    evidenceRef: 'evidence:runtime-dry-run',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-073.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.ok(evidence.blockers.includes('runtime_patch_dry_run_evidence.dry_run_not_allowed'));
}

testReadyRuntimeDryRunEvidence();
testMissingEvidenceRefRequiresReview();
testBlockedDryRunBlocksEvidence();

console.log('runtimePatchOperatorDryRunEvidence tests passed');
