import assert from 'node:assert/strict';

import { recordCockpitPatchPermitConsumeExecutionReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecord.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuthority.js';

const authority: CockpitPatchPermitConsumeExecutionReceiptRecordAuthority = {
  status: 'ready',
  consumeExecutionReceiptRecordAuthorityAllowed: true,
  consumeExecutionReceiptRecordAuthorized: true,
  consumeExecutionReceiptAuthorized: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  executionReceiptRecorded: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationAuthorityId: 'application-authority:cockpit',
  executionAuthorityId: 'execution-authority:cockpit',
  receiptAuthorityId: 'receipt-authority:cockpit',
  receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
  receiptRecordRef: 'receipt-record:cockpit',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-151.md'],
  authorizedReceiptRecord: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_authority',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    executionAuthorityRef: 'execution-authority:cockpit',
    receiptAuthorityRef: 'receipt-authority:cockpit',
    recordRef: 'receipt-record:cockpit',
    policyRef: 'policy:receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects(): void {
  const record = recordCockpitPatchPermitConsumeExecutionReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-155.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecorded, true);
  assert.equal(record.executionReceiptRecorded, true);
  assert.equal(record.durablePersistenceAllowed, false);
  assert.equal(record.patchApplyAllowed, false);
  assert.equal(record.recordedReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_record');
}

function testMissingRecordedAtRequiresReview(): void {
  const record = recordCockpitPatchPermitConsumeExecutionReceipt({
    authority,
    receiptRecordEvidenceRef: 'review-packets/BPK-155.md',
  });

  assert.equal(record.status, 'review_required');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordCockpitPatchPermitConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuthorityAllowed: false, consumeExecutionReceiptRecordAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-155.md',
  });

  assert.equal(record.status, 'blocked');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecord tests passed');
