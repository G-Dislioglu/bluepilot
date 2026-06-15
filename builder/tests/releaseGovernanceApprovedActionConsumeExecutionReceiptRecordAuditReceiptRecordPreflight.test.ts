import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt.js';

const auditReceipt: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
  actionConsumed: false,
  executionReceiptRecorded: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  actionId: 'action:release',
  receiptRecordRef: 'receipt-record:release',
  auditRef: 'audit:release',
  auditAuthorityId: 'audit-authority:release',
  auditReceiptRef: 'audit-receipt:release',
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  recordedAtRef: 'time:2026-06-15T00:00:00Z',
  auditReceiptEvidenceRef: 'review-packets/BPK-182.md',
  releaseLabel: 'bluepilot-bpk',
  evidenceRefs: ['review-packets/BPK-182.md'],
  runbookSteps: ['keep merge closed'],
  recordedAuditReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt',
    auditRef: 'audit:release',
    receiptRef: 'audit-receipt:release',
    receiptAuthorityRef: 'audit-receipt-authority:release',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditReceiptPreflightsRecordWithoutReleaseAction(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordRef: 'audit-receipt-record:release',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_ref_required'));
}

function testBlockedAuditReceiptBlocksRecordPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordRef: 'audit-receipt-record:release',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyAuditReceiptPreflightsRecordWithoutReleaseAction();
testMissingRecordRefRequiresReview();
testBlockedAuditReceiptBlocksRecordPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight tests passed');
