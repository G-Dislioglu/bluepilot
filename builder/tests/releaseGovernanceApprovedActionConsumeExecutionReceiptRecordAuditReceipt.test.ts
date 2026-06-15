import assert from 'node:assert/strict';

import { recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  actionConsumed: false,
  executionReceiptRecorded: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  actionId: 'action:release',
  receiptRecordRef: 'receipt-record:release',
  auditRef: 'audit:release',
  auditAuthorityId: 'audit-authority:release',
  auditReceiptRef: 'audit-receipt:release',
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  authorizedByRef: 'operator:lead',
  expiresAtRef: 'time:2026-06-16T00:00:00Z',
  releaseLabel: 'bluepilot-bpk',
  evidenceRefs: ['review-packets/BPK-178.md'],
  runbookSteps: ['keep merge closed'],
  authorizedAuditReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority',
    auditRef: 'audit:release',
    auditAuthorityRef: 'audit-authority:release',
    receiptRef: 'audit-receipt:release',
    receiptAuthorityRef: 'audit-receipt-authority:release',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditReceiptWithoutReleaseAction(): void {
  const receipt = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-182.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.mergeAllowed, false);
  assert.equal(receipt.externalActionAllowed, false);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.recordedAuditReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt');
}

function testMissingEvidenceRequiresReview(): void {
  const receipt = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt.audit_receipt_evidence_ref_required'));
}

function testBlockedAuthorityBlocksAuditReceipt(): void {
  const receipt = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-182.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditReceiptWithoutReleaseAction();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksAuditReceipt();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt tests passed');
