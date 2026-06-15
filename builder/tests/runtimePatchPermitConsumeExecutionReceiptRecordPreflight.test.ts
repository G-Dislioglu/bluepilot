import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordPreflight.js';
import type { RuntimePatchPermitConsumeExecutionReceiptAuthority } from '../src/runtimePatchPermitConsumeExecutionReceiptAuthority.js';

const authority: RuntimePatchPermitConsumeExecutionReceiptAuthority = {
  status: 'ready',
  consumeExecutionReceiptAuthorityAllowed: true,
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
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-145.md'],
  authorizedReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_authority',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    executionAuthorityRef: 'execution-authority:runtime',
    receiptRef: 'receipt:runtime',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsRecordWithoutWriting(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecord({
    authority,
    receiptRecordRef: 'receipt-record:runtime',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.consumeExecutionReceiptAuthorized, true);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.receiptRecordPlan.kind, 'runtime_patch_permit_consume_execution_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecord({
    authority,
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_preflight.receipt_record_ref_required'));
}

function testBlockedAuthorityBlocksRecordPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptAuthorityAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordRef: 'receipt-record:runtime',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_preflight.receipt_authority_not_allowed'));
}

testReadyAuthorityPreflightsRecordWithoutWriting();
testMissingRecordRefRequiresReview();
testBlockedAuthorityBlocksRecordPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordPreflight tests passed');
