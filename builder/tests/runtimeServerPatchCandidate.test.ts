import assert from 'node:assert/strict';

import { buildRuntimeServerPatchCandidate } from '../src/runtimeServerPatchCandidate.js';
import type { RuntimeMountPatchPreflight } from '../src/runtimeMountPatchPreflight.js';

const preflight: RuntimeMountPatchPreflight = {
  status: 'ready',
  patchPreflightAllowed: true,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  patchRef: 'patch:runtime-mount',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRuntimeServerPatchCandidate(): void {
  const candidate = buildRuntimeServerPatchCandidate({
    preflight,
    candidateRef: 'candidate:runtime-server-patch',
    authorRef: 'author:operator',
    candidateSummary: 'mount runtime dry-run route behind env gate',
  });

  assert.equal(candidate.status, 'ready');
  assert.equal(candidate.patchCandidateAllowed, true);
  assert.equal(candidate.patchApplyAllowed, false);
  assert.equal(candidate.executionExecuted, false);
  assert.equal(candidate.executionAllowed, false);
  assert.ok(candidate.guardChecks.includes('execution_allowed_false'));
}

function testMissingRefsRequireReview(): void {
  const candidate = buildRuntimeServerPatchCandidate({
    preflight,
    authorRef: 'author:operator',
  });

  assert.equal(candidate.status, 'review_required');
  assert.ok(candidate.reviewItems.includes('runtime_server_patch_candidate.candidate_ref_required'));
}

function testBlockedPreflightBlocksCandidate(): void {
  const candidate = buildRuntimeServerPatchCandidate({
    preflight: {
      ...preflight,
      status: 'blocked',
      patchPreflightAllowed: false,
      blockers: ['runtime_mount_patch_preflight.execution_must_remain_closed'],
    },
    candidateRef: 'candidate:runtime-server-patch',
    authorRef: 'author:operator',
  });

  assert.equal(candidate.status, 'blocked');
  assert.ok(candidate.blockers.includes('runtime_server_patch_candidate.preflight_not_allowed'));
}

testReadyRuntimeServerPatchCandidate();
testMissingRefsRequireReview();
testBlockedPreflightBlocksCandidate();

console.log('runtimeServerPatchCandidate tests passed');
