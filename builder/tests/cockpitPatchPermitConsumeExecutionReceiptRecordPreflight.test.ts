import assert from 'node:assert/strict';

import { preflightCockpitPatchPermitConsumeExecutionReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordPreflight.js';
import type { CockpitPatchPermitConsumeExecutionReceiptAuthority } from '../src/cockpitPatchPermitConsumeExecutionReceiptAuthority.js';

const authority: CockpitPatchPermitConsumeExecutionReceiptAuthority = {
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
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationAuthorityId: 'application-authority:cockpit',
  executionAuthorityId: 'execution-authority:cockpit',
  receiptAuthorityId: 'receipt-authority:cockpit',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-143.md'],
  authorizedReceipt: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_authority',
    permitKind: 'cockpit_patch_application',
    permitRef: 'permit:cockpit',
    executionAuthorityRef: 'execution-authority:cockpit',
    receiptRef: 'receipt:cockpit',
    policyRef: 'policy:receipt',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityPreflightsRecordWithoutWriting(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecord({
    authority,
    receiptRecordRef: 'receipt-record:cockpit',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, true);
  assert.equal(preflight.consumeExecutionReceiptAuthorized, true);
  assert.equal(preflight.executionReceiptRecorded, false);
  assert.equal(preflight.patchApplyAllowed, false);
  assert.equal(preflight.receiptRecordPlan.kind, 'cockpit_patch_permit_consume_execution_receipt_record_preflight');
}

function testMissingRecordRefRequiresReview(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecord({
    authority,
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_preflight.receipt_record_ref_required'));
}

function testBlockedAuthorityBlocksRecordPreflight(): void {
  const preflight = preflightCockpitPatchPermitConsumeExecutionReceiptRecord({
    authority: { ...authority, status: 'blocked', consumeExecutionReceiptAuthorityAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordRef: 'receipt-record:cockpit',
    receiptRecorderRef: 'recorder:operator',
    receiptRecordPolicyRef: 'policy:receipt-record',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeExecutionReceiptRecordPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_preflight.receipt_authority_not_allowed'));
}

testReadyAuthorityPreflightsRecordWithoutWriting();
testMissingRecordRefRequiresReview();
testBlockedAuthorityBlocksRecordPreflight();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordPreflight tests passed');
