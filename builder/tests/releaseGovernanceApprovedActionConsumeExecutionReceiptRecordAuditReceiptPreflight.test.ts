import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight.js';
import type { ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit } from '../src/releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit.js';

const audit: ReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAudit = {
  status: 'audited',
  consumeExecutionReceiptRecordAudited: true,
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
  auditAuthorityId: 'audit-authority:release',
  releaseLabel: 'release:bounded',
  evidenceRefs: ['review-packets/BPK-170.md'],
  runbookSteps: ['verify checks'],
  recordedAudit: { kind: 'release_governance_approved_action_consume_execution_receipt_record_audit' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const readyInput = {
  audit,
  auditReceiptRef: 'audit-receipt:release',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptPolicyRef: 'policy:audit-receipt',
};

const ready = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt(readyInput);
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.mergeAllowed, false);
assert.equal(ready.auditReceiptPlan.kind, 'release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight');

const review = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({ audit, auditReceiptRecorderRef: 'recorder:operator', auditReceiptPolicyRef: 'policy:audit-receipt' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required'));

const blocked = preflightReleaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceipt({ ...readyInput, audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAudited: false, blockers: ['blocked'] } });
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('release_governance_approved_action_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete'));

console.log('releaseGovernanceApprovedActionConsumeExecutionReceiptRecordAuditReceiptPreflight tests passed');
