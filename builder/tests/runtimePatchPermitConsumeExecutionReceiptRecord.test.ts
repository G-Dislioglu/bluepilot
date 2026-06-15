import assert from 'node:assert/strict';

import { recordRuntimePatchPermitConsumeExecutionReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptRecord.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuthority.js';

const authority: RuntimePatchPermitConsumeExecutionReceiptRecordAuthority = {
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
  executionExecuted: false,
  executionAllowed: false,
  permitId: 'permit:runtime',
  consumeAuthorityId: 'consume-authority:runtime',
  applicationAuthorityId: 'application-authority:runtime',
  executionAuthorityId: 'execution-authority:runtime',
  receiptAuthorityId: 'receipt-authority:runtime',
  receiptRecordAuthorityId: 'receipt-record-authority:runtime',
  receiptRecordRef: 'receipt-record:runtime',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-153.md'],
  authorizedReceiptRecord: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_authority',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    executionAuthorityRef: 'execution-authority:runtime',
    receiptAuthorityRef: 'receipt-authority:runtime',
    recordRef: 'receipt-record:runtime',
    policyRef: 'policy:receipt-record',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects(): void {
  const record = recordRuntimePatchPermitConsumeExecutionReceipt({
    authority,
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-157.md',
  });

  assert.equal(record.status, 'recorded');
  assert.equal(record.consumeExecutionReceiptRecorded, true);
  assert.equal(record.executionReceiptRecorded, true);
  assert.equal(record.durablePersistenceAllowed, false);
  assert.equal(record.executionAllowed, false);
  assert.equal(record.recordedReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_record');
}

function testMissingRecordedAtRequiresReview(): void {
  const record = recordRuntimePatchPermitConsumeExecutionReceipt({
    authority,
    receiptRecordEvidenceRef: 'review-packets/BPK-157.md',
  });

  assert.equal(record.status, 'review_required');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record.recorded_at_ref_required'));
}

function testBlockedAuthorityBlocksRecord(): void {
  const record = recordRuntimePatchPermitConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptRecordAuthorityAllowed: false, consumeExecutionReceiptRecordAuthorized: false, blockers: ['blocked'] },
    recordedAtRef: 'time:2026-06-15T00:00:00Z',
    receiptRecordEvidenceRef: 'review-packets/BPK-157.md',
  });

  assert.equal(record.status, 'blocked');
  assert.equal(record.executionReceiptRecorded, false);
  assert.ok(record.blockers.includes('runtime_patch_permit_consume_execution_receipt_record.record_authority_not_allowed'));
}

testReadyAuthorityRecordsInMemoryReceiptWithoutExternalEffects();
testMissingRecordedAtRequiresReview();
testBlockedAuthorityBlocksRecord();

console.log('runtimePatchPermitConsumeExecutionReceiptRecord tests passed');
