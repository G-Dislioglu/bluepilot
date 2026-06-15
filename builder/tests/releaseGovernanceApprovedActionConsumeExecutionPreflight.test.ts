import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecution } from '../src/releaseGovernanceApprovedActionConsumeExecutionPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeApplicationAuthority } from '../src/releaseGovernanceApprovedActionConsumeApplicationAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeApplicationAuthority = {
  status: 'ready',
  consumeApplicationAuthorityAllowed: true,
  consumeApplicationAuthorized: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeAuthorityId: 'consume-authority:release',
  applicationAuthorityId: 'application-authority:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  releaseLabel: 'bpk-131-134-consume-execution-preflight',
  evidenceRefs: ['review-packets/BPK-130.md'],
  runbookSteps: ['verify_checks'],
  authorizedApplication: {
    kind: 'release_governance_approved_action_consume_application_authority',
    actionRef: 'action:release',
    applicationRef: 'application:release',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsExecutionWithoutEffects(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecution({
    authority,
    executionPreflightRef: 'execution-preflight:release',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionPreflightAllowed, true);
  assert.equal(preflight.actionConsumed, false);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.consumeExecution.kind, 'release_governance_approved_action_consume_execution_preflight');
}

function testMissingExecutionRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecution({
    authority,
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_preflight.execution_preflight_ref_required'));
}

function testBlockedAuthorityBlocksExecutionPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecution({
    authority: { ...authority, status: 'blocked', consumeApplicationAuthorityAllowed: false, consumeApplicationAuthorized: false, blockers: ['blocked'] },
    executionPreflightRef: 'execution-preflight:release',
    executorRef: 'executor:operator',
    executionPolicyRef: 'policy:execution',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_preflight.application_authority_not_allowed'));
}

testReadyAuthorityPreflightsExecutionWithoutEffects();
testMissingExecutionRefRequiresReview();
testBlockedAuthorityBlocksExecutionPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionPreflight tests passed');
