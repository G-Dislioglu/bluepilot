import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeExecutionReceiptAuthority = {
  status: 'ready',
  consumeExecutionReceiptAuthorityAllowed: true,
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
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-144.md'],
  authorizedReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_authority',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    executionAuthorityRef: 'execution-authority:memory',
    receiptRef: 'receipt:memory',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsRecordWithoutWriting(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord({
    authority,
    receiptRecordRef: 'receipt-record:memory',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.consumeExecutionReceiptAuthorized, true);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.receiptRecordPlan.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord({
    authority,
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_preflight.receipt_record_ref_required'));
}

function testBlockedAuthorityBlocksRecordPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptAuthorityAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordRef: 'receipt-record:memory',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_preflight.receipt_authority_not_allowed'));
}

testReadyAuthorityPreflightsRecordWithoutWriting();
testMissingRecordRefRequiresReview();
testBlockedAuthorityBlocksRecordPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordPreflight tests passed');
