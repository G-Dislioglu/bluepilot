import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

const audit = {
  status: 'audited',
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: true,
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
  auditRef: 'audit:audit-receipt-record:runtime',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-205.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit;

function testReadyAuditPreflightsReceiptWithoutRuntime(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:runtime',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, true);
  assert.equal(preflight.executionExecuted, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight');
}

function testMissingRecorderRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:runtime',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_recorder_ref_required'));
}

function testBlockedAuditBlocksReceiptPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAudited: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:runtime',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete'));
}

testReadyAuditPreflightsReceiptWithoutRuntime();
testMissingRecorderRefRequiresReview();
testBlockedAuditBlocksReceiptPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight tests passed');
