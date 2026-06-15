import assert from 'node:assert/strict';

import { recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';

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
  permitConsumed: false,
  executionReceiptRecorded: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  sourceAuditRef: 'audit:cockpit',
  auditReceiptRecordRef: 'audit-receipt-record:cockpit',
  auditRef: 'audit:audit-receipt-record:cockpit',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:cockpit',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:cockpit',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-211.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority;

function testReadyAuthorityRecordsInMemoryReceiptWithoutWrites(): void {
  const receipt = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-215.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.durablePersistenceAllowed, false);
  assert.equal(receipt.patchApplyAllowed, false);
  assert.equal(receipt.recordedAuditReceiptRecordAuditReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt');
}

function testMissingRecordedAtRequiresReview(): void {
  const receipt = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority,
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-215.md',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksReceipt(): void {
  const receipt = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-215.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutWrites();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksReceipt();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt tests passed');
