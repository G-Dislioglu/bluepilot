import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight.js';

const preflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: true,
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
  auditReceiptRecordAuditReceiptRef: 'audit-receipt-record-audit-receipt:memory',
  format: 'jsonl-preview',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-208.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflight;

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, true);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceipt.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority');
}

function testMissingExpiresAtRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight,
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:memory',
    authorizedByRef: 'authority:operator',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.expires_at_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptAuthorityId: 'audit-receipt-record-audit-receipt-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingExpiresAtRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptAuthority tests passed');
