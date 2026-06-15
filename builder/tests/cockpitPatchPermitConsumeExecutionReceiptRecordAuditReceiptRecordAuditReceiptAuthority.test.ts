import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';

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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  auditRef: 'audit:audit-receipt-record:cockpit',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:cockpit',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-207.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight;

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, true);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.audit_receipt_record_audit_receipt_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority tests passed');
