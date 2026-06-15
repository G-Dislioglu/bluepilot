import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight = {
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
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:memory',
  receiptRecordRef: 'receipt-record:memory',
  auditRef: 'audit:memory',
  auditAuthorityId: 'audit-authority:memory',
  auditReceiptRef: 'audit-receipt:memory',
  format: 'jsonl',
  cacheRef: 'cache:audit',
  previewLines: ['{}'],
  evidenceRefs: ['review-packets/BPK-172.md'],
  auditReceiptPlan: { kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight', permitKind: 'memory_cache_audit_export' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const ready = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({
  preflight,
  auditReceiptAuthorityId: 'audit-receipt-authority:memory',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptAuthorized, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.fileWriteAllowed, false);
assert.equal(ready.authorizedAuditReceipt.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_authority');

const review = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({ preflight, authorizedByRef: 'authority:operator', expiresAtRef: 'expiry:bounded-window' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_authority.audit_receipt_authority_id_required'));

const blocked = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({
  preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
  auditReceiptAuthorityId: 'audit-receipt-authority:memory',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
});
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_authority.preflight_not_allowed'));

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority tests passed');
