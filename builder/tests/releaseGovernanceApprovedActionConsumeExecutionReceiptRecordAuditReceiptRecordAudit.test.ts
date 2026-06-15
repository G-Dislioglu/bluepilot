import assert from 'node:assert/strict';

import { recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: true,
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
  receiptRecordRef: 'receipt-record:release',
  sourceAuditRef: 'audit:release',
  auditReceiptRecordRef: 'audit-receipt-record:release',
  auditRef: 'audit:audit-receipt-record:release',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:release',
  releaseLabel: 'bluepilot-release',
  evidenceRefs: ['review-packets/BPK-202.md'],
  runbookSteps: ['review only'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority;

function testReadyAuthorityRecordsInMemoryAuditWithoutReleaseActions(): void {
  const audit = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-206.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, true);
  assert.equal(audit.mergeAllowed, false);
  assert.equal(audit.externalActionAllowed, false);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.recordedAuditReceiptRecordAudit.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit');
}

function testMissingEvidenceRequiresReview(): void {
  const audit = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.audit_evidence_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-206.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutReleaseActions();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit tests passed');
