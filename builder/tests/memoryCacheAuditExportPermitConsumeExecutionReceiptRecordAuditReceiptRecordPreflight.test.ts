import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt.js';

const auditReceipt: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
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
  auditReceiptAuthorityId: 'audit-receipt-authority:memory',
  recordedAtRef: 'time:2026-06-15T00:00:00Z',
  auditReceiptEvidenceRef: 'review-packets/BPK-180.md',
  format: 'jsonl',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-180.md'],
  recordedAuditReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt',
    permitKind: 'memory_cache_audit_export',
    auditRef: 'audit:memory',
    receiptRef: 'audit-receipt:memory',
    receiptAuthorityRef: 'audit-receipt-authority:memory',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditReceiptPreflightsRecordWithoutWrites(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordRef: 'audit-receipt-record:memory',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.durablePersistenceAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditReceiptRecordPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_preflight');
}

function testMissingPolicyRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordRef: 'audit-receipt-record:memory',
    auditReceiptRecorderRef: 'recorder:operator',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_record_policy_ref_required'));
}

function testBlockedAuditReceiptBlocksRecordPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordRef: 'audit-receipt-record:memory',
    auditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyAuditReceiptPreflightsRecordWithoutWrites();
testMissingPolicyRequiresReview();
testBlockedAuditReceiptBlocksRecordPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight tests passed');
