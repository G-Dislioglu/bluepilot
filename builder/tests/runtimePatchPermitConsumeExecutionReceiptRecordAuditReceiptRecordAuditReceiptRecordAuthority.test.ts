import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';

const preflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: true,
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
  auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:runtime',
  routePath: '/probe/runtime-dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_ROUTE_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-221.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight;

function testReadyPreflightAuthorizesWithoutExecution(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.executionExecuted, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceiptRecord.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority');
}

function testMissingAuthorizedByRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:runtime',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.authorized_by_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutExecution();
testMissingAuthorizedByRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority tests passed');
