import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordPreflightAllowed: true,
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
  receiptRecordRef: 'receipt-record:release',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  releaseLabel: 'bpk-151-154-consume-execution-receipt-record-authority',
  evidenceRefs: ['review-packets/BPK-150.md'],
  runbookSteps: ['verify_checks'],
  receiptRecordPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_preflight',
    actionRef: 'action:release',
    executionAuthorityRef: 'execution-authority:release',
    receiptAuthorityRef: 'receipt-authority:release',
    recordRef: 'receipt-record:release',
    policyRef: 'policy:receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesRecordWithoutWriting(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord({
    preflight,
    receiptRecordAuthorityId: 'receipt-record-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.authorizedReceiptRecord.kind, 'release_governance_approved_action_consume_execution_receipt_record_authority');
}

function testMissingRecordAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_authority.receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksRecordAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordPreflightAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordAuthorityId: 'receipt-record-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesRecordWithoutWriting();
testMissingRecordAuthorityIdRequiresReview();
testBlockedPreflightBlocksRecordAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority tests passed');
