import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedAction } from '../src/releaseGovernanceApprovedActionAuthority.js';
import type { ReleaseGovernanceApprovedActionPreflight } from '../src/releaseGovernanceApprovedActionPreflight.js';

const preflight: ReleaseGovernanceApprovedActionPreflight = {
  status: 'ready',
  approvedActionPreflightAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  preflightRef: 'preflight:release',
  executorRef: 'executor:authority',
  actionPolicyRef: 'policy:release-action',
  releaseLabel: 'bpk-107-110-permit-issue-preflight',
  evidenceRefs: ['review-packets/BPK-110.md'],
  runbookSteps: ['verify_checks'],
  approvedAction: { kind: 'release_governance_approved_action_preflight' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesSideEffectFreeAction(): void {
  const authority = authorizeReleaseGovernanceApprovedAction({
    preflight,
    actionId: 'action:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.approvedActionAuthorized, true);
  assert.equal(authority.actionConsumed, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.authorizedAction.kind, 'release_governance_approved_action_authority');
}

function testMissingActionIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedAction({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.approvedActionAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_authority.action_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedAction({
    preflight: { ...preflight, status: 'blocked', approvedActionPreflightAllowed: false, blockers: ['blocked'] },
    actionId: 'action:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.approvedActionAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesSideEffectFreeAction();
testMissingActionIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionAuthority tests passed');
