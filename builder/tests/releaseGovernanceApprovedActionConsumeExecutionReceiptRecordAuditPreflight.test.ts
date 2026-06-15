import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecord.js';

const record: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecord = {
  status: 'recorded',
  consumeExecutionReceiptRecorded: true,
  consumeExecutionReceiptRecordAuthorized: true,
  consumeExecutionReceiptAuthorized: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  approvedActionConsumeAuthorized: true,
  approvedActionAuthorized: true,
  actionConsumed: false,
  executionReceiptRecorded: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  durablePersistenceAllowed: false,
  actionId: 'action:release',
  receiptRecordRef: 'receipt-record:release',
  receiptRecordAuthorityId: 'receipt-record-authority:release',
  releaseLabel: 'bpk-159-162-consume-execution-receipt-record-audit-preflight',
  evidenceRefs: ['review-packets/BPK-158.md'],
  runbookSteps: ['verify_checks'],
  recordedReceipt: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record',
    recordRef: 'receipt-record:release',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testRecordedRecordPreflightsAuditWithoutWriting(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    record,
    auditRef: 'audit:release',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.executionReceiptRecorded, true);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.auditPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_preflight');
}

function testMissingAuditRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    record,
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.audit_ref_required'));
}

function testIncompleteRecordBlocksAuditPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    record: { ...record, status: 'blocked', consumeExecutionReceiptRecorded: false, executionReceiptRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:release',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_preflight.record_not_complete'));
}

testRecordedRecordPreflightsAuditWithoutWriting();
testMissingAuditRefRequiresReview();
testIncompleteRecordBlocksAuditPreflight();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight tests passed');
