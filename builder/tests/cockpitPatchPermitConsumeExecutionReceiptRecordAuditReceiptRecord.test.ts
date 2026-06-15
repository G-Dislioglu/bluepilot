import assert from 'node:assert/strict';

import { recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority.js';

const authority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: true,
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
  auditRef: 'audit:cockpit',
  auditReceiptRef: 'audit-receipt:cockpit',
  auditReceiptAuthorityId: 'audit-receipt-authority:cockpit',
  auditReceiptRecordRef: 'audit-receipt-record:cockpit',
  auditReceiptRecordAuthorityId: 'audit-receipt-record-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-187.md'],
  blockers: [],
  reviewItems: [],
} as unknown as CockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecordAuthority;

function testReadyAuthorityRecordsInMemory(): void {
  const record = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-191.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecordAuditReceiptRecordRecorded, true);
  assert.equal(record.auditWriteAllowed, false);
  assert.equal(record.durablePersistenceAllowed, false);
  assert.equal(record.recordedAuditReceiptRecord.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record');
}

function testMissingEvidenceRequiresReview(): void {
  const record = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
  });

  assert.equal(record.status, 'review_required');
  assert.ok(record.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record.audit_receipt_record_evidence_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordCockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditReceiptRecordAuthorityAllowed: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    auditReceiptRecordEvidenceRef: 'review-packets/BPK-191.md',
  });

  assert.equal(record.status, 'blocked');
  assert.ok(record.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemory();
testMissingEvidenceRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuditReceiptRecord tests passed');
