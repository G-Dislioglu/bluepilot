import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit.js';

const audit: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit = {
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
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:memory',
  receiptRecordRef: 'receipt-record:memory',
  receiptRecordAuthorityId: 'receipt-record-authority:memory',
  auditRef: 'audit:memory',
  auditAuthorityId: 'audit-authority:memory',
  format: 'jsonl',
  cacheRef: 'cache:audit',
  previewLines: ['{}'],
  evidenceRefs: ['review-packets/BPK-168.md'],
  recordedAudit: { kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit', permitKind: 'memory_cache_audit_export' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const readyInput = {
  audit,
  auditReceiptRef: 'audit-receipt:memory',
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptPolicyRef: 'policy:audit-receipt',
};

const ready = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt(readyInput);
assert.equal(ready.status, 'ready');
assert.equal(ready.consumeExecutionReceiptRecordAuditReceiptPreflightAllowed, true);
assert.equal(ready.auditWriteAllowed, false);
assert.equal(ready.fileWriteAllowed, false);
assert.equal(ready.auditReceiptPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight');

const review = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({ audit, auditReceiptRecorderRef: 'recorder:operator', auditReceiptPolicyRef: 'policy:audit-receipt' });
assert.equal(review.status, 'review_required');
assert.ok(review.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_receipt_ref_required'));

const blocked = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({ ...readyInput, audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAudited: false, blockers: ['blocked'] } });
assert.equal(blocked.status, 'blocked');
assert.ok(blocked.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_preflight.audit_not_complete'));

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptPreflight tests passed');
