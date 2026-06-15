import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

const audit = {
  status: 'audited',
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: true,
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
  auditRef: 'audit:audit-receipt-record:release',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:release',
  releaseLabel: 'bluepilot-release',
  evidenceRefs: ['review-packets/BPK-206.md'],
  runbookSteps: ['review only'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit;

function testReadyAuditPreflightsReceiptWithoutReleaseActions(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:release',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, true);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight');
}

function testMissingReceiptRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_ref_required'));
}

function testBlockedAuditBlocksReceiptPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAudited: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:release',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete'));
}

testReadyAuditPreflightsReceiptWithoutReleaseActions();
testMissingReceiptRefRequiresReview();
testBlockedAuditBlocksReceiptPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight tests passed');
