import assert from 'node:assert/strict';

import { recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: true,
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
  receiptRecordRef: 'receipt-record:memory',
  sourceAuditRef: 'audit:memory',
  auditReceiptRecordRef: 'audit-receipt-record:memory',
  auditRef: 'audit:audit-receipt-record:memory',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:memory',
  format: 'jsonl-preview',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-200.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority;

function testReadyAuthorityRecordsInMemoryAuditWithoutWrites(): void {
  const audit = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-204.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, true);
  assert.equal(audit.fileWriteAllowed, false);
  assert.equal(audit.externalActionAllowed, false);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.recordedAuditReceiptRecordAudit.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit');
}

function testMissingEvidenceRequiresReview(): void {
  const audit = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_evidence_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-204.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutWrites();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit tests passed');
