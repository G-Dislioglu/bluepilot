import assert from 'node:assert/strict';

import { intakeCockpitPatchAuthorityReview } from '../src/cockpitPatchAuthorityReviewIntake.js';
import type { CockpitPatchPermitIssuanceRequestPacket } from '../src/cockpitPatchPermitIssuanceRequestPacket.js';

const requestPacket: CockpitPatchPermitIssuanceRequestPacket = {
  status: 'ready',
  requestPacketAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  requestRef: 'request:cockpit',
  requesterRef: 'requester:operator',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-095.md'],
  packet: { kind: 'cockpit_patch_permit_issuance_request', permitKind: 'cockpit_patch_application' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIntake(): void {
  const intake = intakeCockpitPatchAuthorityReview({
    requestPacket,
    authorityReviewRef: 'authority-review:cockpit',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-099.md',
  });

  assert.equal(intake.status, 'ready');
  assert.equal(intake.authorityReviewIntakeAllowed, true);
  assert.equal(intake.permitIssued, false);
  assert.equal(intake.patchApplyAllowed, false);
  assert.equal(intake.authorityReview.kind, 'cockpit_patch_authority_review_intake');
}

function testMissingAuthorityRefRequiresReview(): void {
  const intake = intakeCockpitPatchAuthorityReview({
    requestPacket,
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-099.md',
  });

  assert.equal(intake.status, 'review_required');
  assert.ok(intake.reviewItems.includes('cockpit_patch_authority_review_intake.authority_review_ref_required'));
}

function testBlockedPacketBlocksIntake(): void {
  const intake = intakeCockpitPatchAuthorityReview({
    requestPacket: { ...requestPacket, status: 'blocked', requestPacketAllowed: false, blockers: ['blocked'] },
    authorityReviewRef: 'authority-review:cockpit',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-099.md',
  });

  assert.equal(intake.status, 'blocked');
  assert.ok(intake.blockers.includes('cockpit_patch_authority_review_intake.request_packet_not_allowed'));
}

testReadyIntake();
testMissingAuthorityRefRequiresReview();
testBlockedPacketBlocksIntake();

console.log('cockpitPatchAuthorityReviewIntake tests passed');
