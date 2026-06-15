import assert from 'node:assert/strict';

import { recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  actionConsumed: false,
  executionReceiptRecorded: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  actionId: 'action:release',
  receiptRecordRef: 'receipt-record:release',
  auditRef: 'audit:release',
  auditReceiptRef: 'audit-receipt:release',
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  auditReceiptRecordRef: 'audit-receipt-record:release',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:release',
  releaseLabel: 'bluepilot-bpk',
  evidenceRefs: ['review-packets/BPK-190.md'],
  runbookSteps: ['keep merge closed'],
  blockers: [],
  reviewItems: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuthority;

function testReadyAuthorityRecordsInMemoryWithoutReleaseAction(): void {
  const record = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-194.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecordAuditReceiptRecordRecorded, true);
  assert.equal(record.mergeAllowed, false);
  assert.equal(record.externalActionAllowed, false);
  assert.equal(record.recordedAuditReceiptRecord.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record');
}

function testMissingRecordedAtRequiresReview(): void {
  const record = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-194.md',
  });

  assert.equal(record.status, 'review_required');
  assert.ok(record.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-194.md',
  });

  assert.equal(record.status, 'blocked');
  assert.ok(record.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryWithoutReleaseAction();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord tests passed');
