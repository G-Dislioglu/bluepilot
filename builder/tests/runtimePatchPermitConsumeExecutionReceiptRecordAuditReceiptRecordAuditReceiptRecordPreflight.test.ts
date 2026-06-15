import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';

const auditReceipt = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: true,
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
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:runtime',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:runtime',
  routePath: '/probe/runtime-dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-217.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt;

function testReadyReceiptPreflightsRecordWithoutExecution(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:runtime',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.executionExecuted, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptRecordPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight');
}

function testMissingRecorderRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:runtime',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_recorder_ref_required'));
}

function testBlockedReceiptBlocksRecordPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:runtime',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyReceiptPreflightsRecordWithoutExecution();
testMissingRecorderRequiresReview();
testBlockedReceiptBlocksRecordPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight tests passed');
