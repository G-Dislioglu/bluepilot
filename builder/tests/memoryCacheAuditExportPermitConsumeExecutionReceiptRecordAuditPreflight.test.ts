import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecord.js';

const record: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecord = {
  status: 'recorded',
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
  permitId: 'permit:memory',
  receiptRecordRef: 'receipt-record:memory',
  receiptRecordAuthorityId: 'receipt-record-authority:memory',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-156.md'],
  recordedReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record',
    permitKind: 'memory_cache_audit_export',
    recordRef: 'receipt-record:memory',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testRecordedRecordPreflightsAuditWithoutWriting(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    record,
    auditRef: 'audit:memory',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.executionReceiptRecorded, true);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.auditPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight');
}

function testMissingAuditRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    record,
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.audit_ref_required'));
}

function testIncompleteRecordBlocksAuditPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    record: { ...record, status: 'blocked', consumeExecutionReceiptRecorded: false, executionReceiptRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:memory',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight.record_not_complete'));
}

testRecordedRecordPreflightsAuditWithoutWriting();
testMissingAuditRefRequiresReview();
testIncompleteRecordBlocksAuditPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight tests passed');
