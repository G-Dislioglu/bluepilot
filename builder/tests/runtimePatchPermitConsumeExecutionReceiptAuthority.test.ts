import assert from 'node:assert/strict';

import { authorizeRuntimePatchPermitConsumeExecutionReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptAuthority.js';
import type { RuntimePatchPermitConsumeExecutionReceiptPreflight } from '../src/runtimePatchPermitConsumeExecutionReceiptPreflight.js';

const preflight: RuntimePatchPermitConsumeExecutionReceiptPreflight = {
  status: 'ready',
  consumeExecutionReceiptPreflightAllowed: true,
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
  receiptRef: 'receipt:runtime',
  recorderRef: 'recorder:operator',
  receiptPolicyRef: 'policy:receipt',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-141.md'],
  consumeExecutionReceipt: {
    kind: 'runtime_patch_permit_consume_execution_receipt_preflight',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    executionAuthorityRef: 'execution-authority:runtime',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesReceiptWithoutEffects(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceipt({
    preflight,
    receiptAuthorityId: 'receipt-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.executionAllowed, false);
  assert.equal(authority.authorizedReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceipt({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_authority.receipt_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeRuntimePatchPermitConsumeExecutionReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptPreflightAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptAuthorityId: 'receipt-authority:runtime',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.blockers.includes('runtime_patch_permit_consume_execution_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesReceiptWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('runtimePatchPermitConsumeExecutionReceiptAuthority tests passed');
