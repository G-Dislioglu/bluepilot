import assert from 'node:assert/strict';

import { intakeReleaseGovernanceAuthorityReview } from '../src/releaseGovernanceAuthorityReviewIntake.js';
import type { ReleaseGovernanceApprovedActionRequestPacket } from '../src/releaseGovernanceApprovedActionRequestPacket.js';

const requestPacket: ReleaseGovernanceApprovedActionRequestPacket = {
  status: 'ready',
  requestPacketAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  requestRef: 'request:release',
  requesterRef: 'requester:operator',
  releaseLabel: 'bpk-095-098-request-packets',
  evidenceRefs: ['review-packets/BPK-098.md'],
  runbookSteps: ['verify_checks'],
  packet: { kind: 'release_governance_approved_action_request' },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyIntake(): void {
  const intake = intakeReleaseGovernanceAuthorityReview({
    requestPacket,
    authorityReviewRef: 'authority-review:release',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-102.md',
  });

  assert.equal(intake.status, 'ready');
  assert.equal(intake.authorityReviewIntakeAllowed, true);
  assert.equal(intake.mergeAllowed, false);
  assert.equal(intake.externalActionAllowed, false);
  assert.equal(intake.authorityReview.kind, 'release_governance_authority_review_intake');
}

function testMissingAuthorityRefRequiresReview(): void {
  const intake = intakeReleaseGovernanceAuthorityReview({
    requestPacket,
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-102.md',
  });

  assert.equal(intake.status, 'review_required');
  assert.ok(intake.reviewItems.includes('release_governance_authority_review_intake.authority_review_ref_required'));
}

function testBlockedPacketBlocksIntake(): void {
  const intake = intakeReleaseGovernanceAuthorityReview({
    requestPacket: { ...requestPacket, status: 'blocked', requestPacketAllowed: false, blockers: ['blocked'] },
    authorityReviewRef: 'authority-review:release',
    reviewerRef: 'authority:operator',
    intakeEvidenceRef: 'review-packets/BPK-102.md',
  });

  assert.equal(intake.status, 'blocked');
  assert.ok(intake.blockers.includes('release_governance_authority_review_intake.request_packet_not_allowed'));
}

testReadyIntake();
testMissingAuthorityRefRequiresReview();
testBlockedPacketBlocksIntake();

console.log('releaseGovernanceAuthorityReviewIntake tests passed');
