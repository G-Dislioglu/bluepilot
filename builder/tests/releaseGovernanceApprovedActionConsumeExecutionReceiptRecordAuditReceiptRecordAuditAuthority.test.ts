import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';

const preflight = {
  status: 'ready',
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
  releaseLabel: 'bluepilot-release',
  evidenceRefs: ['review-packets/BPK-198.md'],
  runbookSteps: ['review only'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight;

function testReadyPreflightAuthorizesWithoutReleaseActions(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight,
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:release',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized, true);
  assert.equal(authority.mergeAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAudit.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight,
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.audit_receipt_record_audit_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:release',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutReleaseActions();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority tests passed');
