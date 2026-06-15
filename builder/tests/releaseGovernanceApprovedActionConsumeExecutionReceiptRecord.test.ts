import assert from 'node:assert/strict';

import { recordReleaseGovernanceApprovedActionConsumeExecutionReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecord.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuthorized: true,
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
  receiptRecordAuthorityId: 'receipt-record-authority:release',
  receiptRecordRef: 'receipt-record:release',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  releaseLabel: 'bpk-155-158-consume-execution-receipt-record',
  evidenceRefs: ['review-packets/BPK-154.md'],
  runbookSteps: ['verify_checks'],
  authorizedReceiptRecord: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_authority',
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

function testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects(): void {
  const record = recordReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-158.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecorded, true);
  assert.equal(record.executionReceiptRecorded, true);
  assert.equal(record.durablePersistenceAllowed, false);
  assert.equal(record.mergeAllowed, false);
  assert.equal(record.recordedReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_record');
}

function testMissingRecordedAtRequiresReview(): void {
  const record = recordReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    authority,
    receiptRecordEvidenceRef: 'review-packets/BPK-158.md',
  });

  assert.equal(record.status, 'review_required');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordReleaseGovernanceApprovedActionConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuthorityAllowed: false, consumeExecutionReceiptRecordAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-158.md',
  });

  assert.equal(record.status, 'blocked');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.blockers.includes('release_governance_approved_action_consume_execution_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecord tests passed');
