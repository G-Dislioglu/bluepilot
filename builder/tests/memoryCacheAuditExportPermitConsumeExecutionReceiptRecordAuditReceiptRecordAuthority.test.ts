import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptPreflightAllowed: true,
  consumeExecutionReceiptRecordAudited: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
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
  auditReceiptRecorderRef: 'recorder:operator',
  auditReceiptRecordPolicyRef: 'policy:audit-receipt-record',
  format: 'jsonl',
  cacheRef: 'cache:memory',
  previewLines: ['{"ok":true}'],
  evidenceRefs: ['review-packets/BPK-184.md'],
  auditReceiptRecordPlan: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_preflight',
    permitKind: 'memory_cache_audit_export',
    receiptRef: 'audit-receipt:memory',
    receiptAuthorityRef: 'audit-receipt-authority:memory',
    recordRef: 'audit-receipt-record:memory',
    policyRef: 'policy:audit-receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesWithoutWrites(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:memory',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, true);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.externalActionAllowed, false);
  assert.equal(authority.authorizedAuditReceiptRecord.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_authority');
}

function testMissingAuthorizedByRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight,
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:memory',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_authority.authorized_by_ref_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordPreflightAllowed: false, blockers: ['blocked'] },
    auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:memory',
    authorizedByRef: 'operator:lead',
    expiresAtRef: 'time:2026-06-16T00:00:00Z',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesWithoutWrites();
testMissingAuthorizedByRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority tests passed');
