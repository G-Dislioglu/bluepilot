import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';

const preflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: true,
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
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:release',
  releaseLabel: 'bluepilot-release',
  evidenceRefs: ['review-packets/BPK-210.md'],
  runbookSteps: ['review only'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight;

function testReadyPreflightAuthorizesWithoutReleaseActions(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, true);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.audit_receipt_record_audit_receipt_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:release',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutReleaseActions();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority tests passed');
