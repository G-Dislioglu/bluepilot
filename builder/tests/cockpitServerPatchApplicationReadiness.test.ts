import assert from 'node:assert/strict';

import { assessCockpitServerPatchApplicationReadiness } from '../src/cockpitServerPatchApplicationReadiness.js';
import type { CockpitServerPatchCandidate } from '../src/cockpitServerPatchCandidate.js';

const candidate: CockpitServerPatchCandidate = {
  status: 'ready',
  patchCandidateAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  candidateRef: 'candidate:cockpit-server-patch',
  authorRef: 'author:operator',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  guardChecks: ['patch_apply_allowed_false'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyCockpitPatchApplicationReadiness(): void {
  const readiness = assessCockpitServerPatchApplicationReadiness({
    candidate,
    readinessRef: 'readiness:cockpit-patch',
    operatorApprovalRef: 'approval:operator',
    diffRef: 'diff:cockpit-patch',
    patchWindowRef: 'window:maintenance',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.applicationReadinessAllowed, true);
  assert.equal(readiness.patchApplyAllowed, false);
  assert.equal(readiness.serverMutationExecuted, false);
  assert.equal(readiness.executableActionAllowed, false);
  assert.ok(readiness.guardChecks.includes('operator_approval_ref_required'));
}

function testMissingOperatorApprovalRequiresReview(): void {
  const readiness = assessCockpitServerPatchApplicationReadiness({
    candidate,
    readinessRef: 'readiness:cockpit-patch',
    diffRef: 'diff:cockpit-patch',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('cockpit_patch_application_readiness.operator_approval_ref_required'));
}

function testBlockedCandidateBlocksReadiness(): void {
  const readiness = assessCockpitServerPatchApplicationReadiness({
    candidate: {
      ...candidate,
      status: 'blocked',
      patchCandidateAllowed: false,
      blockers: ['cockpit_server_patch_candidate.preflight_not_allowed'],
    },
    readinessRef: 'readiness:cockpit-patch',
    operatorApprovalRef: 'approval:operator',
    diffRef: 'diff:cockpit-patch',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('cockpit_patch_application_readiness.candidate_not_allowed'));
}

testReadyCockpitPatchApplicationReadiness();
testMissingOperatorApprovalRequiresReview();
testBlockedCandidateBlocksReadiness();

console.log('cockpitServerPatchApplicationReadiness tests passed');
