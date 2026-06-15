import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';

const preflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: true,
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
  receiptRecordRef: 'receipt-record:runtime',
  sourceAuditRef: 'audit:runtime',
  auditReceiptRecordRef: 'audit-receipt-record:runtime',
  auditRef: 'audit:audit-receipt-record:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-197.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight;

function testReadyPreflightAuthorizesWithoutRuntime(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight,
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:runtime',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized, true);
  assert.equal(authority.executionExecuted, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAudit.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority');
}

function testMissingAuthorizedByRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight,
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:runtime',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.authorized_by_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:runtime',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutRuntime();
testMissingAuthorizedByRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority tests passed');
