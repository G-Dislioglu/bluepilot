import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptPreflight = {
  status: 'ready',
  consumeExecutionReceiptPreflightAllowed: true,
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
  receiptRef: 'receipt:memory',
  recorderRef: 'recorder:operator',
  receiptPolicyRef: 'policy:receipt',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-140.md'],
  consumeExecutionReceipt: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_preflight',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    executionAuthorityRef: 'execution-authority:memory',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesReceiptWithoutEffects(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    preflight,
    receiptAuthorityId: 'receipt-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.authorizedReceipt.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_authority.receipt_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptPreflightAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptAuthorityId: 'receipt-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesReceiptWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptAuthority tests passed');
