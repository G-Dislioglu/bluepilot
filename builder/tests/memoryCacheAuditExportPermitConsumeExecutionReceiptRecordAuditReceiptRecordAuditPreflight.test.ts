import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';

const auditReceiptRecord: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord = {
  status: 'recorded',
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  permitConsumed: false,
  executionReceiptRecorded: true,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:memory',
  receiptRecordRef: 'receipt-record:memory',
  auditRef: 'audit:memory',
  auditReceiptRef: 'audit-receipt:memory',
  auditReceiptAuthorityId: 'audit-receipt-authority:memory',
  auditReceiptRecordRef: 'audit-receipt-record:memory',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:memory',
  format: 'jsonl-preview',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-192.md'],
  recordedAuditReceiptRecord: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record',
    permitKind: 'memory_cache_audit_export',
    receiptRef: 'audit-receipt:memory',
    receiptAuthorityRef: 'audit-receipt-authority:memory',
    recordRef: 'audit-receipt-record:memory',
    recordAuthorityRef: 'audit-receipt-record-authority:memory',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRecordAuditPreflightWithoutWrites(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditRef: 'audit:audit-receipt-record:memory',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, true);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight');
}

function testMissingPolicyRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord,
    auditRef: 'audit:audit-receipt-record:memory',
    auditorRef: 'auditor:operator',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_policy_ref_required'));
}

function testBlockedRecordBlocksAuditPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    auditReceiptRecord: { ...auditReceiptRecord, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordRecorded: false, blockers: ['blocked'] },
    auditRef: 'audit:audit-receipt-record:memory',
    auditorRef: 'auditor:operator',
    auditPolicyRef: 'policy:audit-receipt-record-audit',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_preflight.audit_receipt_record_not_complete'));
}

testReadyRecordAuditPreflightWithoutWrites();
testMissingPolicyRefRequiresReview();
testBlockedRecordBlocksAuditPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditPreflight tests passed');
