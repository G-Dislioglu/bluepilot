import assert from 'node:assert/strict';

import { recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
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
  sourceAuditRef: 'audit:release',
  auditReceiptRecordRef: 'audit-receipt-record:release',
  auditRef: 'audit:audit-receipt-record:release',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:release',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:release',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:release',
  releaseLabel: 'release:dry',
  evidenceRefs: ['review-packets/BPK-214.md'],
  runbookSteps: ['Review only'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority;

function testReadyAuthorityRecordsInMemoryReceiptWithoutMerge(): void {
  const receipt = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-218.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.mergeAllowed, false);
  assert.equal(receipt.externalActionAllowed, false);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.recordedAuditReceiptRecordAuditReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt');
}

function testMissingEvidenceRequiresReview(): void {
  const receipt = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_record_audit_receipt_evidence_ref_required'));
}

function testBlockedAuthorityBlocksReceipt(): void {
  const receipt = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-218.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutMerge();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksReceipt();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt tests passed');
