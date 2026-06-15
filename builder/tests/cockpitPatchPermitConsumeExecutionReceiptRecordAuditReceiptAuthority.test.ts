import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';

const preflight: CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptPreflight = {
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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  auditRef: 'audit:cockpit',
  auditAuthorityId: 'audit-authority:cockpit',
  auditReceiptRef: 'audit-receipt:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-171.md'],
  auditReceiptPlan: { kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_preflight', permitKind: 'cockpit_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const ready = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({
  preflight,
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptAuthorized, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.patchApplyAllowed, false);
assert.equal(ready.authorizedAuditReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority');

const review = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({ preflight, authorizedByRef: 'authority:operator', expiresAtRef: 'expiry:bounded-window' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.audit_receipt_authority_id_required'));

const blocked = authorizeCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceipt({
  preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_authority.preflight_not_allowed'));

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptAuthority tests passed');
