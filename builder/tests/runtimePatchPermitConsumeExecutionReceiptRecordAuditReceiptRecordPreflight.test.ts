import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceipt.js';

const auditReceipt: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
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
  recordedAtRef: 'time:2026-06-15T00:00:00Z',
  auditReceiptEvidenceRef: 'review-packets/BPK-181.md',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-181.md'],
  recordedAuditReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt',
    permitKind: 'runtime_patch_application',
    auditRef: 'audit:runtime',
    receiptRef: 'audit-receipt:runtime',
    receiptAuthorityRef: 'audit-receipt-authority:runtime',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditReceiptPreflightsRecordWithoutRuntimeExecution(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordRef: 'audit-receipt-record:runtime',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.executionExecuted, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight');
}

function testMissingRecorderRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordRef: 'audit-receipt-record:runtime',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_recorder_ref_required'));
}

function testBlockedAuditReceiptBlocksRecordPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordRef: 'audit-receipt-record:runtime',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyAuditReceiptPreflightsRecordWithoutRuntimeExecution();
testMissingRecorderRequiresReview();
testBlockedAuditReceiptBlocksRecordPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight tests passed');
