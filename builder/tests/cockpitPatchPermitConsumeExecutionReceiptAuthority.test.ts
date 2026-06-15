import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceipt } from '../src/cockpitPatchPermitConsumeExecutionReceiptAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptPreflight.js';

const preflight: CockpitPatchPermitConsumeExecutionReceiptPreflight = {
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
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationAuthorityId: 'application-authority:cockpit',
  executionAuthorityId: 'execution-authority:cockpit',
  receiptRef: 'receipt:cockpit',
  recorderRef: 'recorder:operator',
  receiptPolicyRef: 'policy:receipt',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-139.md'],
  consumeExecutionReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_preflight',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    executionAuthorityRef: 'execution-authority:cockpit',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflightAuthorizesReceiptWithoutEffects(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceipt({
    preflight,
    receiptAuthorityId: 'receipt-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.authorizedReceipt.kind, 'cockpit_patch_permit_consume_execution_receipt_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceipt({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_authority.receipt_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceipt({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptPreflightAllowed: false, consumeExecutionAuthorized: false, blockers: ['blocked'] },
    receiptAuthorityId: 'receipt-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptAuthorized, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesReceiptWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptAuthority tests passed');
