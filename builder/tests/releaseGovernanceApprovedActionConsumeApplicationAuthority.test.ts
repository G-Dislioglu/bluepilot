import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeApplication } from '../src/releaseGovernanceApprovedActionConsumeApplicationAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeApplicationPreflight } from '../src/releaseGovernanceApprovedActionConsumeApplicationPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeApplicationPreflight = {
  status: 'ready',
  consumeApplicationPreflightAllowed: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeAuthorityId: 'consume-authority:release',
  applicationRef: 'application:release',
  operatorRef: 'operator:human',
  applicationPolicyRef: 'policy:application',
  releaseLabel: 'bpk-127-130-consume-application-authority',
  evidenceRefs: ['review-packets/BPK-126.md'],
  runbookSteps: ['verify_checks'],
  consumeApplication: {
    kind: 'release_governance_approved_action_consume_application_preflight',
    actionRef: 'action:release',
    authorityRef: 'consume-authority:release',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesApplicationWithoutEffects(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeApplication({
    preflight,
    applicationAuthorityId: 'application-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeApplicationAuthorityAllowed, true);
  assert.equal(authority.consumeApplicationAuthorized, true);
  assert.equal(authority.actionConsumed, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.authorizedApplication.kind, 'release_governance_approved_action_consume_application_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeApplication({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_application_authority.application_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeApplication({
    preflight: { ...preflight, status: 'blocked', consumeApplicationPreflightAllowed: false, approvedActionConsumeAuthorized: false, blockers: ['blocked'] },
    applicationAuthorityId: 'application-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_application_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesApplicationWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeApplicationAuthority tests passed');
