import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';

const preflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: true,
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
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-209.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight;

function testReadyPreflightAuthorizesWithoutRuntime(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, true);
  assert.equal(authority.executionExecuted, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority');
}

function testMissingAuthorizedByRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:runtime',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.authorized_by_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutRuntime();
testMissingAuthorizedByRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority tests passed');
