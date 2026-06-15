import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsume } from '../src/releaseGovernanceApprovedActionConsumeAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumePreflight } from '../src/releaseGovernanceApprovedActionConsumePreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumePreflight = {
  status: 'ready',
  approvedActionConsumePreflightAllowed: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeRef: 'consume:release',
  consumerRef: 'consumer:operator',
  consumePolicyRef: 'policy:consume',
  releaseLabel: 'bpk-119-122-permit-consume-authority',
  evidenceRefs: ['review-packets/BPK-118.md'],
  runbookSteps: ['verify_checks'],
  actionConsume: {
    kind: 'release_governance_approved_action_consume_preflight',
    actionRef: 'action:release',
    authorityRef: 'authority:operator',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesConsumeWithoutConsuming(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsume({
    preflight,
    consumeAuthorityId: 'consume-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.approvedActionConsumeAuthorityAllowed, true);
  assert.equal(authority.approvedActionConsumeAuthorized, true);
  assert.equal(authority.actionConsumed, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.authorizedConsume.kind, 'release_governance_approved_action_consume_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsume({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.approvedActionConsumeAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_authority.consume_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsume({
    preflight: { ...preflight, status: 'blocked', approvedActionConsumePreflightAllowed: false, approvedActionAuthorized: false, blockers: ['blocked'] },
    consumeAuthorityId: 'consume-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.approvedActionConsumeAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesConsumeWithoutConsuming();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeAuthority tests passed');
