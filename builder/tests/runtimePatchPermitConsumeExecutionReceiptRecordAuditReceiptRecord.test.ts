import assert from 'node:assert/strict';

import { recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
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
  auditRef: 'audit:runtime',
  auditReceiptRef: 'audit-receipt:runtime',
  auditReceiptAuthorityId: 'audit-receipt-authority:runtime',
  auditReceiptRecordRef: 'audit-receipt-record:runtime',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:runtime',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-189.md'],
  blockers: [],
  reviewItems: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority;

function testReadyAuthorityRecordsInMemoryWithoutRuntimeExecution(): void {
  const record = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-193.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecordAuditReceiptRecordRecorded, true);
  assert.equal(record.executionExecuted, false);
  assert.equal(record.executionAllowed, false);
  assert.equal(record.recordedAuditReceiptRecord.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record');
}

function testMissingEvidenceRequiresReview(): void {
  const record = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(record.status, 'review_required');
  assert.ok(record.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record.audit_receipt_record_evidence_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-193.md',
  });

  assert.equal(record.status, 'blocked');
  assert.ok(record.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryWithoutRuntimeExecution();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord tests passed');
