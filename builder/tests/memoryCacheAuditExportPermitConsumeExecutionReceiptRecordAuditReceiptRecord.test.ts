import assert from 'node:assert/strict';

import { recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
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
  receiptRecordRef: 'receipt-record:memory',
  auditRef: 'audit:memory',
  auditReceiptRef: 'audit-receipt:memory',
  auditReceiptAuthorityId: 'audit-receipt-authority:memory',
  auditReceiptRecordRef: 'audit-receipt-record:memory',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:memory',
  format: 'jsonl',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-188.md'],
  blockers: [],
  reviewItems: [],
} as unknown as MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority;

function testReadyAuthorityRecordsInMemory(): void {
  const record = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-192.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecordAuditReceiptRecordRecorded, true);
  assert.equal(record.fileWriteAllowed, false);
  assert.equal(record.externalActionAllowed, false);
  assert.equal(record.recordedAuditReceiptRecord.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record');
}

function testMissingRecordedAtRequiresReview(): void {
  const record = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-192.md',
  });

  assert.equal(record.status, 'review_required');
  assert.ok(record.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-192.md',
  });

  assert.equal(record.status, 'blocked');
  assert.ok(record.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemory();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord tests passed');
