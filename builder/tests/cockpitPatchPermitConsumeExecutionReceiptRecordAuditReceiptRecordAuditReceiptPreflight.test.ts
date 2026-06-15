import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

const audit = {
  status: 'audited',
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
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-203.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit;

function testReadyAuditPreflightsReceiptWithoutWrites(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:cockpit',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, true);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight');
}

function testMissingReceiptRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_ref_required'));
}

function testBlockedAuditBlocksReceiptPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAudited: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:cockpit',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete'));
}

testReadyAuditPreflightsReceiptWithoutWrites();
testMissingReceiptRefRequiresReview();
testBlockedAuditBlocksReceiptPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight tests passed');
