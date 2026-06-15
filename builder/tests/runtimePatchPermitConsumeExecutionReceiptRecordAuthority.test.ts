import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceiptRecord } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptRecordPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptRecordPreflight.js';

const preflight: RuntimePatchPermitConsumeExecutionReceiptRecordPreflight = {
  status: 'ready',
  consumeExecutionReceiptRecordPreflightAllowed: true,
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
  receiptRecordRef: 'receipt-record:runtime',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-149.md'],
  receiptRecordPlan: {
    kind: 'runtime_patch_permit_consume_execution_receipt_record_preflight',
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

function testReadyPreflightAuthorizesRecordWithoutWriting(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecord({
    preflight,
    receiptRecordAuthorityId: 'receipt-record-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.authorizedReceiptRecord.kind, 'runtime_patch_permit_consume_execution_receipt_record_authority');
}

function testMissingRecordAuthorityIdRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecord({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_record_authority.receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksRecordAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordPreflightAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordAuthorityId: 'receipt-record-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesRecordWithoutWriting();
testMissingRecordAuthorityIdRequiresReview();
testBlockedPreflightBlocksRecordAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptRecordAuthority tests passed');
