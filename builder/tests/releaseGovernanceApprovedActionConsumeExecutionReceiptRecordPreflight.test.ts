import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptAuthority = {
  status: 'ready',
  consumeExecutionReceiptAuthorityAllowed: true,
  consumeExecutionReceiptAuthorized: true,
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
  receiptAuthorityId: 'receipt-authority:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  releaseLabel: 'bpk-147-150-consume-execution-receipt-record-preflight',
  evidenceRefs: ['review-packets/BPK-146.md'],
  runbookSteps: ['verify_checks'],
  authorizedReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_authority',
    actionRef: 'action:release',
    executionAuthorityRef: 'execution-authority:release',
    receiptRef: 'receipt:release',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsRecordWithoutWriting(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord({
    authority,
    receiptRecordRef: 'receipt-record:release',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.consumeExecutionReceiptAuthorized, true);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.receiptRecordPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord({
    authority,
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_preflight.receipt_record_ref_required'));
}

function testBlockedAuthorityBlocksRecordPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptAuthorityAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordRef: 'receipt-record:release',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_preflight.receipt_authority_not_allowed'));
}

testReadyAuthorityPreflightsRecordWithoutWriting();
testMissingRecordRefRequiresReview();
testBlockedAuthorityBlocksRecordPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight tests passed');
