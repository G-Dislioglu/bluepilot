import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt.js';

const auditReceipt = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  permitConsumed: false,
  executionReceiptRecorded: true,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:memory',
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:memory',
  auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:memory',
  format: 'jsonl-preview',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-216.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt;

function testReadyReceiptPreflightsRecordWithoutWrites(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:memory',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptRecordPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight');
}

function testMissingPolicyRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt,
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:memory',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_record_audit_receipt_record_policy_ref_required'));
}

function testBlockedReceiptBlocksRecordPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    auditReceipt: { ...auditReceipt, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecorded: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:memory',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptRecordPolicyRef: 'policy:audit-receipt-record-audit-receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_preflight.audit_receipt_not_recorded'));
}

testReadyReceiptPreflightsRecordWithoutWrites();
testMissingPolicyRequiresReview();
testBlockedReceiptBlocksRecordPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight tests passed');
