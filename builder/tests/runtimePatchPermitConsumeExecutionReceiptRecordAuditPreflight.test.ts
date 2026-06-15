import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecord.js';

const record: RuntimePatchPermitConsumeExecutionReceiptRecord = {
  status: 'recorded',
  consumeExecutionReceiptRecorded: true,
  consumeExecutionReceiptRecordAuthorized: true,
  consumeExecutionReceiptAuthorized: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  executionReceiptRecorded: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  durablePersistenceAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  receiptRecordAuthorityId: 'receipt-record-authority:runtime',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-157.md'],
  recordedReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record',
    permitKind: 'runtime_patch_application',
    recordRef: 'receipt-record:runtime',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testRecordedRecordPreflightsAuditWithoutWriting(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    record,
    auditRef: 'audit:runtime',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.executionReceiptRecorded, true);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.auditPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_preflight');
}

function testMissingAuditRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    record,
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.audit_ref_required'));
}

function testIncompleteRecordBlocksAuditPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    record: { ...record, status: 'blocked', consumeExecutionReceiptRecorded: false, executionReceiptRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:runtime',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_preflight.record_not_complete'));
}

testRecordedRecordPreflightsAuditWithoutWriting();
testMissingAuditRefRequiresReview();
testIncompleteRecordBlocksAuditPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditPreflight tests passed');
