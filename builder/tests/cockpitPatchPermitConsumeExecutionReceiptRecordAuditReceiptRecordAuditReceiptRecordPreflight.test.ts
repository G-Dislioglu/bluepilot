import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';

const auditReceipt = {
  status: 'recorded',
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
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-215.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt;

function testReadyReceiptPreflightsRecordWithoutWrites(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:cockpit',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptRecordPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_ref_required'));
}

function testBlockedReceiptBlocksRecordPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:cockpit',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyReceiptPreflightsRecordWithoutWrites();
testMissingRecordRefRequiresReview();
testBlockedReceiptBlocksRecordPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight tests passed');
