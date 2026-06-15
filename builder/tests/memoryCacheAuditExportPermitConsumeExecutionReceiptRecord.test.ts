import assert from 'node:assert/strict';

import { recordMemoryCacheAuditExportPermitConsumeExecutionReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecord.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuthorized: true,
  consumeExecutionReceiptAuthorized: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  executionReceiptRecorded: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  consumeAuthorityId: 'consume-authority:memory',
  applicationAuthorityId: 'application-authority:memory',
  executionAuthorityId: 'execution-authority:memory',
  receiptAuthorityId: 'receipt-authority:memory',
  receiptRecordAuthorityId: 'receipt-record-authority:memory',
  receiptRecordRef: 'receipt-record:memory',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-152.md'],
  authorizedReceiptRecord: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_authority',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    executionAuthorityRef: 'execution-authority:memory',
    receiptAuthorityRef: 'receipt-authority:memory',
    recordRef: 'receipt-record:memory',
    policyRef: 'policy:receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects(): void {
  const record = recordMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-156.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecorded, true);
  assert.equal(record.executionReceiptRecorded, true);
  assert.equal(record.durablePersistenceAllowed, false);
  assert.equal(record.fileWriteAllowed, false);
  assert.equal(record.recordedReceipt.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record');
}

function testMissingRecordedAtRequiresReview(): void {
  const record = recordMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    authority,
    receiptRecordEvidenceRef: 'review-packets/BPK-156.md',
  });

  assert.equal(record.status, 'review_required');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuthorityAllowed: false, consumeExecutionReceiptRecordAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-156.md',
  });

  assert.equal(record.status, 'blocked');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecord tests passed');
