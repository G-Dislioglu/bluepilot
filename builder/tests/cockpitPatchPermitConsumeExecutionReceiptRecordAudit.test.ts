import assert from 'node:assert/strict';

import { recordCockpitPatchPermitConsumeExecutionReceiptRecordAudit } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAudit.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuditAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuditAuthority.js';

const authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuditAuthority = {
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
  executableActionAllowed: false,
  durablePersistenceAllowed: false,
  auditWriteAllowed: false,
  permitId: 'permit:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
  auditRef: 'audit:cockpit',
  auditorRef: 'auditor:operator',
  auditPolicyRef: 'policy:audit',
  auditAuthorityId: 'audit-authority:cockpit',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-163.md'],
  authorizedAudit: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_audit_authority',
    permitKind: 'cockpit_patch_application',
    recordRef: 'receipt-record:cockpit',
    auditRef: 'audit:cockpit',
    policyRef: 'policy:audit',
    auditAuthorityRef: 'audit-authority:cockpit',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryAuditWithoutWrites(): void {
  const audit = recordCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    authority,
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-167.md',
  });

  assert.equal(audit.status, 'audited');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, true);
  assert.equal(audit.auditWriteAllowed, false);
  assert.equal(audit.durablePersistenceAllowed, false);
  assert.equal(audit.patchApplyAllowed, false);
  assert.equal(audit.recordedAudit.kind, 'cockpit_patch_permit_consume_execution_receipt_record_audit');
}

function testMissingAuditedAtRequiresReview(): void {
  const audit = recordCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    authority,
    auditEvidenceRef: 'review-packets/BPK-167.md',
  });

  assert.equal(audit.status, 'review_required');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_audit.audited_at_ref_required'));
}

function testBlockedAuthorityBlocksAudit(): void {
  const audit = recordCockpitPatchPermitConsumeExecutionReceiptRecordAudit({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuditAuthorityAllowed: false, consumeExecutionReceiptRecordAuditAuthorized: false, blockers: ['blocked'] },
    auditedAtRef: 'time:2026-06-15T00:00:00Z',
    auditEvidenceRef: 'review-packets/BPK-167.md',
  });

  assert.equal(audit.status, 'blocked');
  assert.equal(audit.consumeExecutionReceiptRecordAudited, false);
  assert.ok(audit.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_audit.audit_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryAuditWithoutWrites();
testMissingAuditedAtRequiresReview();
testBlockedAuthorityBlocksAudit();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAudit tests passed');
