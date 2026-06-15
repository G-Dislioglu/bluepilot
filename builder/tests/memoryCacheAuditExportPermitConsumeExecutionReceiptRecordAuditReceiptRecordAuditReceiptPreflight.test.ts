import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';

const audit = {
  status: 'audited',
  consumeExecutionReceiptRecordAuditReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: true,
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
  auditRef: 'audit:audit-receipt-record:memory',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:memory',
  format: 'jsonl-preview',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-204.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit;

function testReadyAuditPreflightsReceiptWithoutWrites(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:memory',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, true);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.auditWriteAllowed, false);
  assert.equal(preflight.auditReceiptRecordAuditReceiptPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight');
}

function testMissingPolicyRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit,
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:memory',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_receipt_record_audit_receipt_policy_ref_required'));
}

function testBlockedAuditBlocksReceiptPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    audit: { ...audit, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAudited: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:memory',
    auditReceiptRecordAuditReceiptRecorderRef: 'recorder:operator',
    auditReceiptRecordAuditReceiptPolicyRef: 'policy:audit-receipt-record-audit-receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_preflight.audit_not_complete'));
}

testReadyAuditPreflightsReceiptWithoutWrites();
testMissingPolicyRefRequiresReview();
testBlockedAuditBlocksReceiptPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight tests passed');
