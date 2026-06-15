import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight.js';

const preflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: true,
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
  auditReceiptRecordAuditReceiptRecordRef: 'audit-receipt-record-audit-receipt-record:memory',
  format: 'jsonl-preview',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-220.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflight;

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecordAuditReceiptRecord.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority');
}

function testMissingExpiresAtRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:memory',
    authorizedByRef: 'authority:operator',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.expires_at_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuditReceiptRecordAuthorityId: 'audit-receipt-record-audit-receipt-record-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingExpiresAtRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditReceiptRecordAuthority tests passed');
