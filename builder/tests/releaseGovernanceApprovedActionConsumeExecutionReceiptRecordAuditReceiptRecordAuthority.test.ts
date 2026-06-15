import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: true,
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
  auditReceiptRef: 'audit-receipt:release',
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  auditReceiptRecordRef: 'audit-receipt-record:release',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  releaseLabel: 'bluepilot-bpk',
  evidenceRefs: ['review-packets/BPK-186.md'],
  runbookSteps: ['keep merge closed'],
  auditReceiptRecordPlan: {
    kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_preflight',
    receiptRef: 'audit-receipt:release',
    receiptAuthorityRef: 'audit-receipt-authority:release',
    recordRef: 'audit-receipt-record:release',
    policyRef: 'policy:audit-receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesWithoutReleaseAction(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:release',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecord.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_authority.audit_receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:release',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutReleaseAction();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuthority tests passed');
