import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt.js';

const auditReceipt: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt = {
  status: 'recorded',
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
  auditAuthorityId: 'audit-authority:cockpit',
  auditReceiptRef: 'audit-receipt:cockpit',
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  recordedAtRef: 'time:2026-06-15T00:00:00Z',
  auditReceiptEvidenceRef: 'review-packets/BPK-179.md',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-179.md'],
  recordedAuditReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt',
    permitKind: 'cockpit_patch_application',
    auditRef: 'audit:cockpit',
    receiptRef: 'audit-receipt:cockpit',
    receiptAuthorityRef: 'audit-receipt-authority:cockpit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditReceiptPreflightsRecordWithoutWrites(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordRef: 'audit-receipt-record:cockpit',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.auditReceiptRecordPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_ref_required'));
}

function testBlockedAuditReceiptBlocksRecordPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordRef: 'audit-receipt-record:cockpit',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyAuditReceiptPreflightsRecordWithoutWrites();
testMissingRecordRefRequiresReview();
testBlockedAuditReceiptBlocksRecordPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight tests passed');
