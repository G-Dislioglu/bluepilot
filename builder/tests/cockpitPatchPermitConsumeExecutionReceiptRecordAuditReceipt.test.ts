import assert from 'node:assert/strict';

import { recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';

const authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
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
  auditRef: 'audit:cockpit',
  auditAuthorityId: 'audit-authority:cockpit',
  auditReceiptRef: 'audit-receipt:cockpit',
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  authorizedByRef: 'operator:lead',
  expiresAtRef: 'time:2026-06-16T00:00:00Z',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-175.md'],
  authorizedAuditReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority',
    permitKind: 'cockpit_patch_application',
    auditRef: 'audit:cockpit',
    auditAuthorityRef: 'audit-authority:cockpit',
    receiptRef: 'audit-receipt:cockpit',
    receiptAuthorityRef: 'audit-receipt-authority:cockpit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditReceiptWithoutWrites(): void {
  const receipt = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-179.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.durablePersistenceAllowed, false);
  assert.equal(receipt.patchApplyAllowed, false);
  assert.equal(receipt.recordedAuditReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt');
}

function testMissingRecordedAtRequiresReview(): void {
  const receipt = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    auditReceiptEvidenceRef: 'review-packets/BPK-179.md',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksAuditReceipt(): void {
  const receipt = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-179.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditReceiptWithoutWrites();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksAuditReceipt();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt tests passed');
