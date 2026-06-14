import assert from 'node:assert/strict';

import { buildCockpitServerPatchCandidate } from '../src/cockpitServerPatchCandidate.js';
import type { CockpitMountPatchPreflight } from '../src/cockpitMountPatchPreflight.js';

const preflight: CockpitMountPatchPreflight = {
  status: 'ready',
  patchPreflightAllowed: true,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  patchRef: 'patch:cockpit-mount',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyCockpitServerPatchCandidate(): void {
  const candidate = buildCockpitServerPatchCandidate({
    preflight,
    candidateRef: 'candidate:cockpit-server-patch',
    authorRef: 'author:operator',
    candidateSummary: 'mount cockpit read-only route behind env gate',
  });

  assert.equal(candidate.status, 'ready');
  assert.equal(candidate.patchCandidateAllowed, true);
  assert.equal(candidate.patchApplyAllowed, false);
  assert.equal(candidate.serverMutationExecuted, false);
  assert.equal(candidate.executableActionAllowed, false);
  assert.ok(candidate.guardChecks.includes('patch_apply_allowed_false'));
}

function testMissingRefsRequireReview(): void {
  const candidate = buildCockpitServerPatchCandidate({
    preflight,
    authorRef: 'author:operator',
  });

  assert.equal(candidate.status, 'review_required');
  assert.ok(candidate.reviewItems.includes('cockpit_server_patch_candidate.candidate_ref_required'));
}

function testBlockedPreflightBlocksCandidate(): void {
  const candidate = buildCockpitServerPatchCandidate({
    preflight: {
      ...preflight,
      status: 'blocked',
      patchPreflightAllowed: false,
      blockers: ['cockpit_mount_patch_preflight.plan_not_allowed'],
    },
    candidateRef: 'candidate:cockpit-server-patch',
    authorRef: 'author:operator',
  });

  assert.equal(candidate.status, 'blocked');
  assert.ok(candidate.blockers.includes('cockpit_server_patch_candidate.preflight_not_allowed'));
}

testReadyCockpitServerPatchCandidate();
testMissingRefsRequireReview();
testBlockedPreflightBlocksCandidate();

console.log('cockpitServerPatchCandidate tests passed');
