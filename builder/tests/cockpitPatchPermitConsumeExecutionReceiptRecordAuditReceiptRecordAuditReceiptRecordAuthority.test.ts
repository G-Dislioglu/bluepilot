import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';

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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:cockpit',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:cockpit',
  auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-219.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight;

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceiptRecord.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.audit_receipt_record_audit_receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority tests passed');
