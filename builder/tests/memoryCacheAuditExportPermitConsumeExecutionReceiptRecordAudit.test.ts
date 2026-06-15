import assert from 'node:assert/strict';

import { recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditAuthorityAllowed: true,
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
  auditorRef: 'auditor:operator',
  auditPolicyRef: 'policy:audit',
  auditAuthorityId: 'audit-authority:memory',
  format: 'jsonl',
  cacheRef: 'cache:audit',
  previewLines: ['{"status":"preview"}'],
  evidenceRefs: ['review-packets/BPK-164.md'],
  authorizedAudit: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_authority',
    permitKind: 'memory_cache_audit_export',
    recordRef: 'receipt-record:memory',
    auditRef: 'audit:memory',
    policyRef: 'policy:audit',
    auditAuthorityRef: 'audit-authority:memory',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditWithoutWrites(): void {
  const audit = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-168.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, true);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.durablePersistenceAllowed, false);
  assert.equal(audit.fileWriteAllowed, false);
  assert.equal(audit.recordedAudit.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit');
}

function testMissingAuditedAtRequiresReview(): void {
  const audit = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    authority,
    auditEvidenceRef: 'review-packets/BPK-168.md',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit.audited_at_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-168.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutWrites();
testMissingAuditedAtRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit tests passed');
