import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';

const preflight: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight = {
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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  auditRef: 'audit:cockpit',
  auditReceiptRef: 'audit-receipt:cockpit',
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  auditReceiptRecordRef: 'audit-receipt-record:cockpit',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-183.md'],
  auditReceiptRecordPlan: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight',
    permitKind: 'cockpit_patch_application',
    receiptRef: 'audit-receipt:cockpit',
    receiptAuthorityRef: 'audit-receipt-authority:cockpit',
    recordRef: 'audit-receipt-record:cockpit',
    policyRef: 'policy:audit-receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:cockpit',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecord.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.audit_receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:cockpit',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority tests passed');
