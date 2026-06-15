import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';

const auditReceiptRecord: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
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
  auditRef: 'audit:cockpit',
  auditReceiptRef: 'audit-receipt:cockpit',
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  auditReceiptRecordRef: 'audit-receipt-record:cockpit',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-191.md'],
  recordedAuditReceiptRecord: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record',
    permitKind: 'cockpit_patch_application',
    receiptRef: 'audit-receipt:cockpit',
    receiptAuthorityRef: 'audit-receipt-authority:cockpit',
    recordRef: 'audit-receipt-record:cockpit',
    recordAuthorityRef: 'audit-receipt-record-authority:cockpit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRecordAuditPreflightWithoutWrites(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditRef: 'audit:audit-receipt-record:cockpit',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight');
}

function testMissingAuditRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_ref_required'));
}

function testBlockedRecordBlocksAuditPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord: { ...auditReceiptRecord, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:audit-receipt-record:cockpit',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_record_not_complete'));
}

testReadyRecordAuditPreflightWithoutWrites();
testMissingAuditRefRequiresReview();
testBlockedRecordBlocksAuditPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight tests passed');
