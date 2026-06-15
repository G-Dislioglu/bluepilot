import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptPreflight.js';
import type { CockpitPatchPermitConsumeExecutionAuthority } from '../src/cockpitPatchPermitConsumeExecutionAuthority.js';

const authority: CockpitPatchPermitConsumeExecutionAuthority = {
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
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationAuthorityId: 'application-authority:cockpit',
  executionAuthorityId: 'execution-authority:cockpit',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-135.md'],
  authorizedExecution: {
    kind: 'cockpit_patch_permit_consume_execution_authority',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    applicationAuthorityRef: 'application-authority:cockpit',
    executionPreflightRef: 'execution-preflight:cockpit',
    policyRef: 'policy:execution',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsReceiptWithoutEffects(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceipt({
    authority,
    receiptRef: 'receipt:cockpit',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.consumeExecutionReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_preflight');
}

function testMissingReceiptRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceipt({
    authority,
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_preflight.receipt_ref_required'));
}

function testBlockedAuthorityBlocksReceiptPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceipt({
    authority: { ...authority, status: 'blocked', consumeExecutionAuthorityAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptRef: 'receipt:cockpit',
    recorderRef: 'recorder:operator',
    receiptPolicyRef: 'policy:receipt',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_preflight.execution_authority_not_allowed'));
}

testReadyAuthorityPreflightsReceiptWithoutEffects();
testMissingReceiptRefRequiresReview();
testBlockedAuthorityBlocksReceiptPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptPreflight tests passed');
