import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsume } from '../src/releaseGovernanceApprovedActionConsumePreflight.js';
import type { ReleaseGovernanceApprovedActionAuthority } from '../src/releaseGovernanceApprovedActionAuthority.js';

const authority: ReleaseGovernanceApprovedActionAuthority = {
  status: 'ready',
  approvedActionAuthorityAllowed: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  releaseLabel: 'bpk-115-118-permit-consume-preflight',
  evidenceRefs: ['review-packets/BPK-114.md'],
  runbookSteps: ['verify_checks'],
  authorizedAction: {
    kind: 'release_governance_approved_action_authority',
    preflightRef: 'preflight:release',
    policyRef: 'policy:release-action',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyConsumePreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsume({
    authority,
    consumeRef: 'consume:release',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.approvedActionConsumePreflightAllowed, true);
  assert.equal(preflight.approvedActionAuthorized, true);
  assert.equal(preflight.actionConsumed, false);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.actionConsume.kind, 'release_governance_approved_action_consume_preflight');
}

function testMissingConsumeRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsume({
    authority,
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.approvedActionConsumePreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_preflight.consume_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsume({
    authority: { ...authority, status: 'blocked', approvedActionAuthorityAllowed: false, approvedActionAuthorized: false, blockers: ['blocked'] },
    consumeRef: 'consume:release',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.approvedActionConsumePreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_preflight.authority_not_allowed'));
}

testReadyConsumePreflightKeepsSideEffectsClosed();
testMissingConsumeRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('releaseGovernanceApprovedActionConsumePreflight tests passed');
