import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditPreflight.js';

const preflight: CockpitPatchPermitConsumeExecutionReceiptRecordAuditPreflight = {
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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
  auditRef: 'audit:cockpit',
  auditorRef: 'auditor:operator',
  auditPolicyRef: 'policy:audit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-159.md'],
  auditPlan: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_preflight',
    permitKind: 'cockpit_patch_application',
    recordRef: 'receipt-record:cockpit',
    auditRef: 'audit:cockpit',
    policyRef: 'policy:audit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesAuditWithoutWriting(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    preflight,
    auditAuthorityId: 'audit-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, true);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.authorizedAudit.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_authority');
}

function testMissingAuditAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_authority.audit_authority_id_required'));
}

function testBlockedPreflightBlocksAuditAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditAuthorityId: 'audit-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesAuditWithoutWriting();
testMissingAuditAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuditAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditAuthority tests passed');
