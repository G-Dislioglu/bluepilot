import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptPreflight = {
  status: 'ready',
  consumeExecutionReceiptPreflightAllowed: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  executionReceiptRecorded: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeAuthorityId: 'consume-authority:release',
  applicationAuthorityId: 'application-authority:release',
  executionAuthorityId: 'execution-authority:release',
  receiptRef: 'receipt:release',
  recorderRef: 'recorder:operator',
  receiptPolicyRef: 'policy:receipt',
  releaseLabel: 'bpk-143-146-consume-execution-receipt-authority',
  evidenceRefs: ['review-packets/BPK-142.md'],
  runbookSteps: ['verify_checks'],
  consumeExecutionReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_preflight',
    actionRef: 'action:release',
    executionAuthorityRef: 'execution-authority:release',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesReceiptWithoutEffects(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    preflight,
    receiptAuthorityId: 'receipt-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.authorizedReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_authority.receipt_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptPreflightAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptAuthorityId: 'receipt-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesReceiptWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptAuthority tests passed');
