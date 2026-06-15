import assert from 'node:assert/strict';

import { recordRuntimePatchPermitConsumeExecutionReceiptRecordAudit } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAudit.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuditAuthority.js';

const authority: RuntimePatchPermitConsumeExecutionReceiptRecordAuditAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuditAuthorized: true,
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
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  receiptRecordAuthorityId: 'receipt-record-authority:runtime',
  auditRef: 'audit:runtime',
  auditorRef: 'auditor:operator',
  auditPolicyRef: 'policy:audit',
  auditAuthorityId: 'audit-authority:runtime',
  routePath: '/runtime/dry-run',
  envGateName: 'BLUEPILOT_RUNTIME_PATCH_ENABLED',
  proposedFiles: ['builder/src/runtimeDryRunRoute.ts'],
  evidenceRefs: ['review-packets/BPK-165.md'],
  authorizedAudit: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_audit_authority',
    permitKind: 'runtime_patch_application',
    recordRef: 'receipt-record:runtime',
    auditRef: 'audit:runtime',
    policyRef: 'policy:audit',
    auditAuthorityRef: 'audit-authority:runtime',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditWithoutRuntimeExecution(): void {
  const audit = recordRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-169.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, true);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.durablePersistenceAllowed, false);
  assert.equal(audit.executionExecuted, false);
  assert.equal(audit.recordedAudit.kind, 'runtime_patch_permit_consume_execution_receipt_record_audit');
}

function testMissingAuditedAtRequiresReview(): void {
  const audit = recordRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    authority,
    auditEvidenceRef: 'review-packets/BPK-169.md',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_audit.audited_at_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordRuntimePatchPermitConsumeExecutionReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-169.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutRuntimeExecution();
testMissingAuditedAtRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAudit tests passed');
