import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';

const preflight: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: true,
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
  auditReceiptRef: 'audit-receipt:runtime',
  auditReceiptAuthorityId: 'audit-receipt-authority:runtime',
  auditReceiptRecordRef: 'audit-receipt-record:runtime',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-185.md'],
  auditReceiptRecordPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight',
    permitKind: 'runtime_patch_application',
    receiptRef: 'audit-receipt:runtime',
    receiptAuthorityRef: 'audit-receipt-authority:runtime',
    recordRef: 'audit-receipt-record:runtime',
    policyRef: 'policy:audit-receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesWithoutRuntimeExecution(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:runtime',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.executionExecuted, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecord.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority');
}

function testMissingExpiryRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:runtime',
    authorizedByRef: 'operator:lead',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.expires_at_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:runtime',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutRuntimeExecution();
testMissingExpiryRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority tests passed');
