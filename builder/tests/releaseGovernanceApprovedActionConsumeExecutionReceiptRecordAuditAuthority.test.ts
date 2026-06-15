import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditPreflight = {
  status: 'ready',
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
  releaseLabel: 'release:bounded',
  evidenceRefs: ['review-packets/BPK-162.md'],
  runbookSteps: ['verify checks'],
  auditPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_preflight',
    recordRef: 'receipt-record:release',
    auditRef: 'audit:release',
    policyRef: 'policy:audit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesAuditWithoutMerge(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    preflight,
    auditAuthorityId: 'audit-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, true);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.authorizedAudit.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_authority');
}

function testMissingAuditAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_authority.audit_authority_id_required'));
}

function testBlockedPreflightBlocksAuditAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditAuthorityId: 'audit-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesAuditWithoutMerge();
testMissingAuditAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuditAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditAuthority tests passed');
