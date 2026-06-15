import assert from 'node:assert/strict';

import { intakeRuntimePatchAuthorityReview } from '../src/runtimePatchAuthorityReviewIntake.js';
import type { RuntimePatchPermitIssuanceRequestPacket } from '../src/runtimePatchPermitIssuanceRequestPacket.js';

const requestPacket: RuntimePatchPermitIssuanceRequestPacket = {
  status: 'ready',
  requestPacketAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  requestRef: 'request:runtime',
  requesterRef: 'requester:operator',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-097.md'],
  packet: { kind: 'runtime_patch_permit_issuance_request', permitKind: 'runtime_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIntake(): void {
  const intake = intakeRuntimePatchAuthorityReview({
    requestPacket,
    authorityReviewRef: 'authority-review:runtime',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-101.md',
  });

  assert.equal(intake.status, 'ready');
  assert.equal(intake.authorityReviewIntakeAllowed, true);
  assert.equal(intake.permitIssued, false);
  assert.equal(intake.executionAllowed, false);
  assert.equal(intake.authorityReview.kind, 'runtime_patch_authority_review_intake');
}

function testMissingAuthorityRefRequiresReview(): void {
  const intake = intakeRuntimePatchAuthorityReview({
    requestPacket,
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-101.md',
  });

  assert.equal(intake.status, 'review_required');
  assert.ok(intake.reviewItems.includes('runtime_patch_authority_review_intake.authority_review_ref_required'));
}

function testBlockedPacketBlocksIntake(): void {
  const intake = intakeRuntimePatchAuthorityReview({
    requestPacket: { ...requestPacket, status: 'blocked', requestPacketAllowed: false, blockers: ['blocked'] },
    authorityReviewRef: 'authority-review:runtime',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-101.md',
  });

  assert.equal(intake.status, 'blocked');
  assert.ok(intake.blockers.includes('runtime_patch_authority_review_intake.request_packet_not_allowed'));
}

testReadyIntake();
testMissingAuthorityRefRequiresReview();
testBlockedPacketBlocksIntake();

console.log('runtimePatchAuthorityReviewIntake tests passed');
