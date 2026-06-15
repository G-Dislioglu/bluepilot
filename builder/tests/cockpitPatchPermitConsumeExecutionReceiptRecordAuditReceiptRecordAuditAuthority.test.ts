import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';

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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  sourceAuditRef: 'audit:cockpit',
  auditReceiptRecordRef: 'audit-receipt-record:cockpit',
  auditRef: 'audit:audit-receipt-record:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-195.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight;

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight,
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:cockpit',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized, true);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAudit.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight,
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.audit_receipt_record_audit_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:cockpit',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority tests passed');
