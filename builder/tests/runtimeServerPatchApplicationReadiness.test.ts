import assert from 'node:assert/strict';

import { assessRuntimeServerPatchApplicationReadiness } from '../src/runtimeServerPatchApplicationReadiness.js';
import type { RuntimeServerPatchCandidate } from '../src/runtimeServerPatchCandidate.js';

const candidate: RuntimeServerPatchCandidate = {
  status: 'ready',
  patchCandidateAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  candidateRef: 'candidate:runtime-server-patch',
  authorRef: 'author:operator',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  guardChecks: ['execution_allowed_false'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRuntimePatchApplicationReadiness(): void {
  const readiness = assessRuntimeServerPatchApplicationReadiness({
    candidate,
    readinessRef: 'readiness:runtime-patch',
    operatorApprovalRef: 'approval:operator',
    diffRef: 'diff:runtime-patch',
    executionClosedRef: 'execution-closed:runtime',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.applicationReadinessAllowed, true);
  assert.equal(readiness.patchApplyAllowed, false);
  assert.equal(readiness.executionExecuted, false);
  assert.equal(readiness.executionAllowed, false);
  assert.ok(readiness.guardChecks.includes('execution_closed_ref_required'));
}

function testMissingExecutionClosedRefRequiresReview(): void {
  const readiness = assessRuntimeServerPatchApplicationReadiness({
    candidate,
    readinessRef: 'readiness:runtime-patch',
    operatorApprovalRef: 'approval:operator',
    diffRef: 'diff:runtime-patch',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('runtime_patch_application_readiness.execution_closed_ref_required'));
}

function testBlockedCandidateBlocksReadiness(): void {
  const readiness = assessRuntimeServerPatchApplicationReadiness({
    candidate: {
      ...candidate,
      status: 'blocked',
      patchCandidateAllowed: false,
      blockers: ['runtime_server_patch_candidate.preflight_not_allowed'],
    },
    readinessRef: 'readiness:runtime-patch',
    operatorApprovalRef: 'approval:operator',
    diffRef: 'diff:runtime-patch',
    executionClosedRef: 'execution-closed:runtime',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('runtime_patch_application_readiness.candidate_not_allowed'));
}

testReadyRuntimePatchApplicationReadiness();
testMissingExecutionClosedRefRequiresReview();
testBlockedCandidateBlocksReadiness();

console.log('runtimeServerPatchApplicationReadiness tests passed');
