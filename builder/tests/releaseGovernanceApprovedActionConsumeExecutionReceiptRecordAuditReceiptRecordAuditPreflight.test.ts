import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord.js';

const auditReceiptRecord: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  actionConsumed: false,
  executionReceiptRecorded: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  actionId: 'action:release',
  receiptRecordRef: 'receipt-record:release',
  auditRef: 'audit:release',
  auditReceiptRef: 'audit-receipt:release',
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  auditReceiptRecordRef: 'audit-receipt-record:release',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:release',
  releaseLabel: 'bluepilot-preflight',
  evidenceRefs: ['review-packets/BPK-194.md'],
  runbookSteps: ['review only'],
  recordedAuditReceiptRecord: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record',
    receiptRef: 'audit-receipt:release',
    receiptAuthorityRef: 'audit-receipt-authority:release',
    recordRef: 'audit-receipt-record:release',
    recordAuthorityRef: 'audit-receipt-record-authority:release',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRecordAuditPreflightWithoutReleaseActions(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditRef: 'audit:audit-receipt-record:release',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight');
}

function testMissingAuditRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_ref_required'));
}

function testBlockedRecordBlocksAuditPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord: { ...auditReceiptRecord, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:audit-receipt-record:release',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_record_not_complete'));
}

testReadyRecordAuditPreflightWithoutReleaseActions();
testMissingAuditRefRequiresReview();
testBlockedRecordBlocksAuditPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight tests passed');
