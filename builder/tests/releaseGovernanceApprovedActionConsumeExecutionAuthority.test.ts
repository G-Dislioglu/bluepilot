import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecution } from '../src/releaseGovernanceApprovedActionConsumeExecutionAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeExecutionPreflight = {
  status: 'ready',
  consumeExecutionPreflightAllowed: true,
  consumeApplicationAuthorized: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeAuthorityId: 'consume-authority:release',
  applicationAuthorityId: 'application-authority:release',
  executionPreflightRef: 'execution-preflight:release',
  executorRef: 'executor:operator',
  executionPolicyRef: 'policy:execution',
  releaseLabel: 'bpk-135-138-consume-execution-authority',
  evidenceRefs: ['review-packets/BPK-134.md'],
  runbookSteps: ['verify_checks'],
  consumeExecution: {
    kind: 'release_governance_approved_action_consume_execution_preflight',
    actionRef: 'action:release',
    applicationAuthorityRef: 'application-authority:release',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesExecutionWithoutEffects(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecution({
    preflight,
    executionAuthorityId: 'execution-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionAuthorized, true);
  assert.equal(authority.actionConsumed, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.authorizedExecution.kind, 'release_governance_approved_action_consume_execution_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecution({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_authority.execution_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecution({
    preflight: { ...preflight, status: 'blocked', consumeExecutionPreflightAllowed: false, approvedActionConsumeAuthorized: false, blockers: ['blocked'] },
    executionAuthorityId: 'execution-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesExecutionWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionAuthority tests passed');
