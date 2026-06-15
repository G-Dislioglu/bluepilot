import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeApplication } from '../src/releaseGovernanceApprovedActionConsumeApplicationPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeAuthority } from '../src/releaseGovernanceApprovedActionConsumeAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeAuthority = {
  status: 'ready',
  approvedActionConsumeAuthorityAllowed: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeAuthorityId: 'consume-authority:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  releaseLabel: 'bpk-123-126-consume-application-preflight',
  evidenceRefs: ['review-packets/BPK-122.md'],
  runbookSteps: ['verify_checks'],
  authorizedConsume: {
    kind: 'release_governance_approved_action_consume_authority',
    actionRef: 'action:release',
    preflightRef: 'consume:release',
    policyRef: 'policy:consume',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyApplicationPreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeApplication({
    authority,
    applicationRef: 'application:release',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeApplicationPreflightAllowed, true);
  assert.equal(preflight.approvedActionConsumeAuthorized, true);
  assert.equal(preflight.actionConsumed, false);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.consumeApplication.kind, 'release_governance_approved_action_consume_application_preflight');
}

function testMissingApplicationRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeApplication({
    authority,
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_application_preflight.application_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeApplication({
    authority: { ...authority, status: 'blocked', approvedActionConsumeAuthorityAllowed: false, approvedActionConsumeAuthorized: false, blockers: ['blocked'] },
    applicationRef: 'application:release',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_application_preflight.authority_not_allowed'));
}

testReadyApplicationPreflightKeepsSideEffectsClosed();
testMissingApplicationRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('releaseGovernanceApprovedActionConsumeApplicationPreflight tests passed');
