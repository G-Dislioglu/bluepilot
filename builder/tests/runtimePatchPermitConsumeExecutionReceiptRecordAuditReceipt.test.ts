import assert from 'node:assert/strict';

import { recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceipt.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';

const authority: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority = {
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
  executionExecuted: false,
  executionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  auditRef: 'audit:runtime',
  auditAuthorityId: 'audit-authority:runtime',
  auditReceiptRef: 'audit-receipt:runtime',
  auditReceiptAuthorityId: 'audit-receipt-authority:runtime',
  authorizedByRef: 'operator:lead',
  expiresAtRef: 'time:2026-06-16T00:00:00Z',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-177.md'],
  authorizedAuditReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_authority',
    permitKind: 'runtime_patch_application',
    auditRef: 'audit:runtime',
    auditAuthorityRef: 'audit-authority:runtime',
    receiptRef: 'audit-receipt:runtime',
    receiptAuthorityRef: 'audit-receipt-authority:runtime',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditReceiptWithoutRuntimeExecution(): void {
  const receipt = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-181.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.executionExecuted, false);
  assert.equal(receipt.executionAllowed, false);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.recordedAuditReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt');
}

function testMissingRecordedAtRequiresReview(): void {
  const receipt = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    auditReceiptEvidenceRef: 'review-packets/BPK-181.md',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksAuditReceipt(): void {
  const receipt = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-181.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditReceiptWithoutRuntimeExecution();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksAuditReceipt();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceipt tests passed');
