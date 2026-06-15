import assert from 'node:assert/strict';

import { decideReleaseGovernanceAuthorityReview } from '../src/releaseGovernanceAuthorityReviewDecisionGate.js';
import type { ReleaseGovernanceAuthorityReviewIntake } from '../src/releaseGovernanceAuthorityReviewIntake.js';

const intake: ReleaseGovernanceAuthorityReviewIntake = {
  status: 'ready',
  authorityReviewIntakeAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  authorityReviewRef: 'authority-review:release',
  reviewerRef: 'authority:operator',
  intakeEvidenceRef: 'review-packets/BPK-102.md',
  releaseLabel: 'bpk-099-102-authority-review-intake',
  evidenceRefs: ['review-packets/BPK-102.md'],
  runbookSteps: ['verify_checks'],
  authorityReview: {
    kind: 'release_governance_authority_review_intake',
    requestKind: 'release_governance_approved_action_request',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = decideReleaseGovernanceAuthorityReview({
    intake,
    decision: 'approve',
    decisionRef: 'decision:release-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:release',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.authorityDecisionGateAllowed, true);
  assert.equal(gate.mergeAllowed, false);
  assert.equal(gate.externalActionAllowed, false);
  assert.equal(gate.authorityDecision.kind, 'release_governance_authority_review_decision');
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = decideReleaseGovernanceAuthorityReview({
    intake,
    decision: 'approve',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:release',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('release_governance_authority_review_decision.decision_ref_required'));
}

function testRejectedDecisionBlocksGate(): void {
  const gate = decideReleaseGovernanceAuthorityReview({
    intake,
    decision: 'reject',
    decisionRef: 'decision:release-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:release',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('release_governance_authority_review_decision.authority_reject'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testRejectedDecisionBlocksGate();

console.log('releaseGovernanceAuthorityReviewDecisionGate tests passed');
