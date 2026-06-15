import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAudit.js';

const audit: RuntimePatchPermitConsumeExecutionReceiptRecordAudit = {
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
  executionExecuted: false,
  executionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  receiptRecordAuthorityId: 'receipt-record-authority:runtime',
  auditRef: 'audit:runtime',
  auditAuthorityId: 'audit-authority:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-169.md'],
  recordedAudit: { kind: 'runtime_patch_permit_consume_execution_receipt_record_audit', permitKind: 'runtime_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const readyInput = {
  audit,
  auditReceiptRef: 'audit-receipt:runtime',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptPolicyRef: 'policy:audit-receipt',
};

const ready = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt(readyInput);
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.executionExecuted, false);
assert.equal(ready.auditReceiptPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight');

const review = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({ audit, auditReceiptRecorderRef: 'recorder:operator', auditReceiptPolicyRef: 'policy:audit-receipt' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required'));

const blocked = preflightRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({ ...readyInput, audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAudited: false, blockers: ['blocked'] } });
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete'));

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight tests passed');
