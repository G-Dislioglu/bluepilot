import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight } from '../src/memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditPreflight = {
  status: 'ready',
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
  format: 'jsonl',
  cacheRef: 'cache:audit',
  previewLines: ['{"status":"preview"}'],
  evidenceRefs: ['review-packets/BPK-160.md'],
  auditPlan: {
    kind: 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_preflight',
    permitKind: 'memory_cache_audit_export',
    recordRef: 'receipt-record:memory',
    auditRef: 'audit:memory',
    policyRef: 'policy:audit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesAuditWithoutWriting(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    preflight,
    auditAuthorityId: 'audit-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, true);
  assert.equal(authority.auditWriteAllowed, false);
  assert.equal(authority.durablePersistenceAllowed, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.authorizedAudit.kind, 'memory_cache_audit_export_permit_consume_execution_receipt_record_audit_authority');
}

function testMissingAuditAuthorityIdRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_authority.audit_authority_id_required'));
}

function testBlockedPreflightBlocksAuditAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeExecutionReceiptRecordAudit({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordAuditPreflightAllowed: false, blockers: ['blocked'] },
    auditAuthorityId: 'audit-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuditAuthorized, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_execution_receipt_record_audit_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesAuditWithoutWriting();
testMissingAuditAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuditAuthority();

console.log('memoryCacheAuditExportPermitConsumeExecutionReceiptRecordAuditAuthority tests passed');
