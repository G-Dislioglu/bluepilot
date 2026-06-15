import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';

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
  actionConsumed: false,
  executionReceiptRecorded: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  actionId: 'action:release',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:release',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:release',
  releaseLabel: 'release:dry',
  evidenceRefs: ['review-packets/BPK-218.md'],
  runbookSteps: ['Review only'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt;

function testReadyReceiptPreflightsRecordWithoutMerge(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:release',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptRecordPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_ref_required'));
}

function testBlockedReceiptBlocksRecordPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:release',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyReceiptPreflightsRecordWithoutMerge();
testMissingRecordRefRequiresReview();
testBlockedReceiptBlocksRecordPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight tests passed');
