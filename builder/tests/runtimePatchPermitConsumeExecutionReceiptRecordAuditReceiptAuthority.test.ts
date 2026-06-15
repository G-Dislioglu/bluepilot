import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';

const preflight: RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
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
  auditRef: 'audit:runtime',
  auditAuthorityId: 'audit-authority:runtime',
  auditReceiptRef: 'audit-receipt:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-173.md'],
  auditReceiptPlan: { kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_preflight', permitKind: 'runtime_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const ready = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({
  preflight,
  auditReceiptAuthorityId: 'audit-receipt-authority:runtime',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptAuthorized, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.executionExecuted, false);
assert.equal(ready.authorizedAuditReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_authority');

const review = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({ preflight, authorizedByRef: 'authority:operator', expiresAtRef: 'expiry:bounded-window' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_authority.audit_receipt_authority_id_required'));

const blocked = authorizeRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceipt({
  preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
  auditReceiptAuthorityId: 'audit-receipt-authority:runtime',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_authority.preflight_not_allowed'));

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority tests passed');
