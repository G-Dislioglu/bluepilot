import assert from 'node:assert/strict';

import { recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';

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
  executionExecuted: false,
  executionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  sourceAuditRef: 'audit:runtime',
  auditReceiptRecordRef: 'audit-receipt-record:runtime',
  auditRef: 'audit:audit-receipt-record:runtime',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:runtime',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:runtime',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:runtime',
  routePath: '/probe/runtime-dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-213.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority;

function testReadyAuthorityRecordsInMemoryReceiptWithoutExecution(): void {
  const receipt = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-217.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.executionExecuted, false);
  assert.equal(receipt.executionAllowed, false);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.recordedAuditReceiptRecordAuditReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt');
}

function testMissingRecordedAtRequiresReview(): void {
  const receipt = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority,
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-217.md',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksReceipt(): void {
  const receipt = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordAuditReceiptEvidenceRef: 'review-packets/BPK-217.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutExecution();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksReceipt();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt tests passed');
