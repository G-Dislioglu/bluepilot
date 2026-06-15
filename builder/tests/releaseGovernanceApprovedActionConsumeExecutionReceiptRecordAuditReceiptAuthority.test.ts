import assert from 'node:assert/strict';

import { authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight.js';

const preflight: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
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
  auditRef: 'audit:release',
  auditAuthorityId: 'audit-authority:release',
  auditReceiptRef: 'audit-receipt:release',
  releaseLabel: 'release:bounded',
  evidenceRefs: ['review-packets/BPK-174.md'],
  runbookSteps: ['verify checks'],
  auditReceiptPlan: { kind: 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const ready = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({
  preflight,
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptAuthorized, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.mergeAllowed, false);
assert.equal(ready.authorizedAuditReceipt.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority');

const review = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({ preflight, authorizedByRef: 'authority:operator', expiresAtRef: 'expiry:bounded-window' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.audit_receipt_authority_id_required'));

const blocked = authorizeReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({
  preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
  auditReceiptAuthorityId: 'audit-receipt-authority:release',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_authority.preflight_not_allowed'));

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptAuthority tests passed');
