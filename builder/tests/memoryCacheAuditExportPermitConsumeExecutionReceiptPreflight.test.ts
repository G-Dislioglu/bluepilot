import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeExecutionReceipt } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionAuthority } from '../src/memoryCacheAuditExportPermitConsumeExecutionAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeExecutionAuthority = {
  status: 'ready',
  consumeExecutionAuthorityAllowed: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  consumeAuthorityId: 'consume-authority:memory',
  applicationAuthorityId: 'application-authority:memory',
  executionAuthorityId: 'execution-authority:memory',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-136.md'],
  authorizedExecution: {
    kind: 'memory_cache_audit_export_permit_consume_execution_authority',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    applicationAuthorityRef: 'application-authority:memory',
    executionPreflightRef: 'execution-preflight:memory',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsReceiptWithoutEffects(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    authority,
    receiptRef: 'receipt:memory',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.consumeExecutionReceipt.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_preflight');
}

function testMissingReceiptRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    authority,
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_preflight.receipt_ref_required'));
}

function testBlockedAuthorityBlocksReceiptPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionAuthorityAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptRef: 'receipt:memory',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_preflight.execution_authority_not_allowed'));
}

testReadyAuthorityPreflightsReceiptWithoutEffects();
testMissingReceiptRefRequiresReview();
testBlockedAuthorityBlocksReceiptPreflight();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptPreflight tests passed');
