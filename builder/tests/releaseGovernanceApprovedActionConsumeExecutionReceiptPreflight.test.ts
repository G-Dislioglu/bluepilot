import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeExecutionAuthority = {
  status: 'ready',
  consumeExecutionAuthorityAllowed: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  mergeAllowed: false,
  externalActionAllowed: false,
  actionId: 'action:release',
  consumeAuthorityId: 'consume-authority:release',
  applicationAuthorityId: 'application-authority:release',
  executionAuthorityId: 'execution-authority:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  releaseLabel: 'bpk-139-142-consume-execution-receipt-preflight',
  evidenceRefs: ['review-packets/BPK-138.md'],
  runbookSteps: ['verify_checks'],
  authorizedExecution: {
    kind: 'release_governance_approved_action_consume_execution_authority',
    actionRef: 'action:release',
    applicationAuthorityRef: 'application-authority:release',
    executionPreflightRef: 'execution-preflight:release',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsReceiptWithoutEffects(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    authority,
    receiptRef: 'receipt:release',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, true);
  assert.equal(preflight.actionConsumed, false);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.consumeExecutionReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_preflight');
}

function testMissingReceiptRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    authority,
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_preflight.receipt_ref_required'));
}

function testBlockedAuthorityBlocksReceiptPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionAuthorityAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptRef: 'receipt:release',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_preflight.execution_authority_not_allowed'));
}

testReadyAuthorityPreflightsReceiptWithoutEffects();
testMissingReceiptRefRequiresReview();
testBlockedAuthorityBlocksReceiptPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptPreflight tests passed');
