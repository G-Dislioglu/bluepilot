import assert from 'node:assert/strict';

import { recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuditPreflightAllowed: true,
  consumeExecutionReceiptRecordAuditReceiptRecordRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorized: true,
  consumeExecutionReceiptRecordAuditReceiptRecorded: true,
  consumeExecutionReceiptRecordAuditReceiptAuthorized: true,
  permitConsumed: false,
  executionReceiptRecorded: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  sourceAuditRef: 'audit:runtime',
  auditReceiptRecordRef: 'audit-receipt-record:runtime',
  auditRef: 'audit:audit-receipt-record:runtime',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-201.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as RuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority;

function testReadyAuthorityRecordsInMemoryAuditWithoutRuntime(): void {
  const audit = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-205.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, true);
  assert.equal(audit.executionExecuted, false);
  assert.equal(audit.executionAllowed, false);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.recordedAuditReceiptRecordAudit.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit');
}

function testMissingAuditedAtRequiresReview(): void {
  const audit = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditEvidenceRef: 'review-packets/BPK-205.md',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audited_at_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordRuntimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-205.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutRuntime();
testMissingAuditedAtRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit tests passed');
