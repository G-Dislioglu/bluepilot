import assert from 'node:assert/strict';

import { recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority.js';

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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  sourceAuditRef: 'audit:cockpit',
  auditReceiptRecordRef: 'audit-receipt-record:cockpit',
  auditRef: 'audit:audit-receipt-record:cockpit',
  auditReceiptRecordAuditAuthorityId: 'audit-receipt-record-audit-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-199.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuditAuthority;

function testReadyAuthorityRecordsInMemoryAuditWithoutWrites(): void {
  const audit = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-203.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, true);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.durablePersistenceAllowed, false);
  assert.equal(audit.patchApplyAllowed, false);
  assert.equal(audit.recordedAuditReceiptRecordAudit.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit');
}

function testMissingAuditedAtRequiresReview(): void {
  const audit = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority,
    auditEvidenceRef: 'review-packets/BPK-203.md',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audited_at_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-203.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAuditReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutWrites();
testMissingAuditedAtRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAudit tests passed');
