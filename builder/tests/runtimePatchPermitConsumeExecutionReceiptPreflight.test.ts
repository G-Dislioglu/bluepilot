import assert from 'node:assert/strict';

import { preflightRuntimePatchPermitConsumeExecutionReceipt } from '../src/runtimePatchPermitConsumeExecutionReceiptPreflight.js';
import type { RuntimePatchPermitConsumeExecutionAuthority } from '../src/runtimePatchPermitConsumeExecutionAuthority.js';

const authority: RuntimePatchPermitConsumeExecutionAuthority = {
  status: 'ready',
  consumeExecutionAuthorityAllowed: true,
  consumeExecutionAuthorized: true,
  consumeApplicationAuthorized: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  permitId: 'permit:runtime',
  consumeAuthorityId: 'consume-authority:runtime',
  applicationAuthorityId: 'application-authority:runtime',
  executionAuthorityId: 'execution-authority:runtime',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-137.md'],
  authorizedExecution: {
    kind: 'runtime_patch_permit_consume_execution_authority',
    permitKind: 'runtime_patch_application',
    permitRef: 'permit:runtime',
    applicationAuthorityRef: 'application-authority:runtime',
    executionPreflightRef: 'execution-preflight:runtime',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsReceiptWithoutEffects(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceipt({
    authority,
    receiptRef: 'receipt:runtime',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.executionAllowed, false);
  assert.equal(preflight.consumeExecutionReceipt.kind, 'runtime_patch_permit_consume_execution_receipt_preflight');
}

function testMissingReceiptRefRequiresReview(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceipt({
    authority,
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('runtime_patch_permit_consume_execution_receipt_preflight.receipt_ref_required'));
}

function testBlockedAuthorityBlocksReceiptPreflight(): void {
  const preflight = preflightRuntimePatchPermitConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionAuthorityAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptRef: 'receipt:runtime',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('runtime_patch_permit_consume_execution_receipt_preflight.execution_authority_not_allowed'));
}

testReadyAuthorityPreflightsReceiptWithoutEffects();
testMissingReceiptRefRequiresReview();
testBlockedAuthorityBlocksReceiptPreflight();

console.log('runtimePatchPermitConsumeExecutionReceiptPreflight tests passed');
