import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecord.js';

const record: CockpitPatchPermitConsumeExecutionReceiptRecord = {
  status: 'recorded',
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
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-155.md'],
  recordedReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record',
    permitKind: 'cockpit_patch_application',
    recordRef: 'receipt-record:cockpit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testRecordedRecordPreflightsAuditWithoutWriting(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    record,
    auditRef: 'audit:cockpit',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.executionReceiptRecorded, true);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.auditPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_preflight');
}

function testMissingAuditRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    record,
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_preflight.audit_ref_required'));
}

function testIncompleteRecordBlocksAuditPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    record: { ...record, status: 'blocked', consumeExecutionReceiptRecorded: false, executionReceiptRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:cockpit',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_preflight.record_not_complete'));
}

testRecordedRecordPreflightsAuditWithoutWriting();
testMissingAuditRefRequiresReview();
testIncompleteRecordBlocksAuditPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditPreflight tests passed');
