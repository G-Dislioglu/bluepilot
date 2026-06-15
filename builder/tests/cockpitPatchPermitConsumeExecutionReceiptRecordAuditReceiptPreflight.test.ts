import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAudit.js';

const audit: CockpitPatchPermitConsumeExecutionReceiptRecordAudit = {
  status: 'audited',
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditPreflightAllowed: true,
  consumeExecutionReceiptRecorded: true,
  consumeExecutionReceiptRecordAuthorized: true,
  consumeExecutionReceiptAuthorized: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  executionReceiptRecorded: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
  auditRef: 'audit:cockpit',
  auditAuthorityId: 'audit-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-167.md'],
  recordedAudit: { kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit', permitKind: 'cockpit_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const readyInput = {
  audit,
  auditReceiptRef: 'audit-receipt:cockpit',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptPolicyRef: 'policy:audit-receipt',
};

const ready = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt(readyInput);
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.patchApplyAllowed, false);
assert.equal(ready.auditReceiptPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_preflight');

const review = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({ audit, auditReceiptRecorderRef: 'recorder:operator', auditReceiptPolicyRef: 'policy:audit-receipt' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required'));

const blocked = preflightCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({ ...readyInput, audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAudited: false, blockers: ['blocked'] } });
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete'));

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight tests passed');
