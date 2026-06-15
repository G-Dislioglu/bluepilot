import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditPreflight.js';

const preflight: RuntimePatchPermitConsumeExecutionReceiptRecordAuditPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditPreflightAllowed: true,
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
  auditWriteAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  receiptRecordAuthorityId: 'receipt-record-authority:runtime',
  auditRef: 'audit:runtime',
  auditorRef: 'auditor:operator',
  auditPolicyRef: 'policy:audit',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-161.md'],
  auditPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_preflight',
    permitKind: 'runtime_patch_application',
    recordRef: 'receipt-record:runtime',
    auditRef: 'audit:runtime',
    policyRef: 'policy:audit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesAuditWithoutRuntimeExecution(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    preflight,
    auditAuthorityId: 'audit-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, true);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.executionExecuted, false);
  assert.equal(authority.authorizedAudit.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_authority');
}

function testMissingAuditAuthorityIdRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_authority.audit_authority_id_required'));
}

function testBlockedPreflightBlocksAuditAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditAuthorityId: 'audit-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesAuditWithoutRuntimeExecution();
testMissingAuditAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuditAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditAuthority tests passed');
