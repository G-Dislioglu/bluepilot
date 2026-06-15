import assert from 'node:assert/strict';

import { recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority.js';

const authority: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditPreflightAllowed: true,
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
  auditWriteAllowed: false,
  actionId: 'approved-action:release',
  receiptRecordRef: 'receipt-record:release',
  receiptRecordAuthorityId: 'receipt-record-authority:release',
  auditRef: 'audit:release',
  auditorRef: 'auditor:operator',
  auditPolicyRef: 'policy:audit',
  auditAuthorityId: 'audit-authority:release',
  releaseLabel: 'release:bounded',
  evidenceRefs: ['review-packets/BPK-166.md'],
  runbookSteps: ['verify checks'],
  authorizedAudit: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_authority',
    recordRef: 'receipt-record:release',
    auditRef: 'audit:release',
    policyRef: 'policy:audit',
    auditAuthorityRef: 'audit-authority:release',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditWithoutMerge(): void {
  const audit = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-170.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, true);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.durablePersistenceAllowed, false);
  assert.equal(audit.mergeAllowed, false);
  assert.equal(audit.recordedAudit.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit');
}

function testMissingAuditedAtRequiresReview(): void {
  const audit = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    authority,
    auditEvidenceRef: 'review-packets/BPK-170.md',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit.audited_at_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-170.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutMerge();
testMissingAuditedAtRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit tests passed');
