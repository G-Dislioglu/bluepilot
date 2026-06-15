import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';

const auditReceiptRecord: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
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
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-193.md'],
  recordedAuditReceiptRecord: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record',
    permitKind: 'runtime_patch_application',
    receiptRef: 'audit-receipt:runtime',
    receiptAuthorityRef: 'audit-receipt-authority:runtime',
    recordRef: 'audit-receipt-record:runtime',
    recordAuthorityRef: 'audit-receipt-record-authority:runtime',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRecordAuditPreflightWithoutRuntime(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditRef: 'audit:audit-receipt-record:runtime',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.executionExecuted, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight');
}

function testMissingAuditorRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditRef: 'audit:audit-receipt-record:runtime',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.auditor_ref_required'));
}

function testBlockedRecordBlocksAuditPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord: { ...auditReceiptRecord, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:audit-receipt-record:runtime',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_record_not_complete'));
}

testReadyRecordAuditPreflightWithoutRuntime();
testMissingAuditorRefRequiresReview();
testBlockedRecordBlocksAuditPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight tests passed');
