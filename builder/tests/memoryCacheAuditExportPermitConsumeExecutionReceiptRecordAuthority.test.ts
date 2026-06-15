import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordPreflightAllowed: true,
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
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  receiptRecordRef: 'receipt-record:memory',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-148.md'],
  receiptRecordPlan: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_preflight',
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

function testReadyPreflightAuthorizesRecordWithoutWriting(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord({
    preflight,
    receiptRecordAuthorityId: 'receipt-record-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.authorizedReceiptRecord.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_authority');
}

function testMissingRecordAuthorityIdRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksRecordAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordPreflightAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordAuthorityId: 'receipt-record-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesRecordWithoutWriting();
testMissingRecordAuthorityIdRequiresReview();
testBlockedPreflightBlocksRecordAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuthority tests passed');
