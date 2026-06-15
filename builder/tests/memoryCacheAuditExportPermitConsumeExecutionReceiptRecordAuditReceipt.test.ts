import assert from 'node:assert/strict';

import { recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
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
  authorizedByRef: 'operator:lead',
  expiresAtRef: 'time:2026-06-16T00:00:00Z',
  format: 'jsonl',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-176.md'],
  authorizedAuditReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_authority',
    permitKind: 'memory_cache_audit_export',
    auditRef: 'audit:memory',
    auditAuthorityRef: 'audit-authority:memory',
    receiptRef: 'audit-receipt:memory',
    receiptAuthorityRef: 'audit-receipt-authority:memory',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditReceiptWithoutWrites(): void {
  const receipt = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-180.md',
  });

  assert.equal(receipt.status, 'recorded');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, true);
  assert.equal(receipt.auditWriteAllowed, false);
  assert.equal(receipt.durablePersistenceAllowed, false);
  assert.equal(receipt.fileWriteAllowed, false);
  assert.equal(receipt.recordedAuditReceipt.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt');
}

function testMissingEvidenceRequiresReview(): void {
  const receipt = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(receipt.status, 'review_required');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_evidence_ref_required'));
}

function testBlockedAuthorityBlocksAuditReceipt(): void {
  const receipt = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptEvidenceRef: 'review-packets/BPK-180.md',
  });

  assert.equal(receipt.status, 'blocked');
  assert.equal(receipt.consumeExecutionReceiptRecordAuditReceiptRecorded, false);
  assert.ok(receipt.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt.audit_receipt_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditReceiptWithoutWrites();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksAuditReceipt();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceipt tests passed');
