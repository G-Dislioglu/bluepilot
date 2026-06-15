import assert from 'node:assert/strict';

import { authorizeCockpitPatchPermitConsumeExecutionReceiptRecord } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordAuthority.js';
import type { CockpitPatchPermitConsumeExecutionReceiptRecordPreflight } from '../src/cockpitPatchPermitConsumeExecutionReceiptRecordPreflight.js';

const preflight: CockpitPatchPermitConsumeExecutionReceiptRecordPreflight = {
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
  executableActionAllowed: false,
  permitId: 'permit:cockpit',
  consumeAuthorityId: 'consume-authority:cockpit',
  applicationAuthorityId: 'application-authority:cockpit',
  executionAuthorityId: 'execution-authority:cockpit',
  receiptAuthorityId: 'receipt-authority:cockpit',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  receiptRecordRef: 'receipt-record:cockpit',
  receiptRecorderRef: 'recorder:operator',
  receiptRecordPolicyRef: 'policy:receipt-record',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-147.md'],
  receiptRecordPlan: {
    kind: 'cockpit_patch_permit_consume_execution_receipt_record_preflight',
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

function testReadyPreflightAuthorizesRecordWithoutWriting(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecord({
    preflight,
    receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorityAllowed, true);
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, true);
  assert.equal(authority.executionReceiptRecorded, false);
  assert.equal(authority.patchApplyAllowed, false);
  assert.equal(authority.authorizedReceiptRecord.kind, 'cockpit_patch_permit_consume_execution_receipt_record_authority');
}

function testMissingRecordAuthorityIdRequiresReview(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecord({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.reviewItems.includes('cockpit_patch_permit_consume_execution_receipt_record_authority.receipt_record_authority_id_required'));
}

function testBlockedPreflightBlocksRecordAuthority(): void {
  const authority = authorizeCockpitPatchPermitConsumeExecutionReceiptRecord({
    preflight: { ...preflight, status: 'blocked', consumeExecutionReceiptRecordPreflightAllowed: false, consumeExecutionReceiptAuthorized: false, blockers: ['blocked'] },
    receiptRecordAuthorityId: 'receipt-record-authority:cockpit',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeExecutionReceiptRecordAuthorized, false);
  assert.ok(authority.blockers.includes('cockpit_patch_permit_consume_execution_receipt_record_authority.preflight_not_allowed'));
}

testReadyPreflightAuthorizesRecordWithoutWriting();
testMissingRecordAuthorityIdRequiresReview();
testBlockedPreflightBlocksRecordAuthority();

console.log('cockpitPatchPermitConsumeExecutionReceiptRecordAuthority tests passed');
