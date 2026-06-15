import assert from 'node:assert/strict';

import { decideCockpitPatchAuthorityReview } from '../src/cockpitPatchAuthorityReviewDecisionGate.js';
import type { CockpitPatchAuthorityReviewIntake } from '../src/cockpitPatchAuthorityReviewIntake.js';

const intake: CockpitPatchAuthorityReviewIntake = {
  status: 'ready',
  authorityReviewIntakeAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  authorityReviewRef: 'authority-review:cockpit',
  reviewerRef: 'authority:operator',
  intakeEvidenceRef: 'review-packets/BPK-099.md',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-099.md'],
  authorityReview: {
    kind: 'cockpit_patch_authority_review_intake',
    requestKind: 'cockpit_patch_permit_issuance_request',
    permitKind: 'cockpit_patch_application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = decideCockpitPatchAuthorityReview({
    intake,
    decision: 'approve',
    decisionRef: 'decision:cockpit-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:cockpit',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.authorityDecisionGateAllowed, true);
  assert.equal(gate.permitIssued, false);
  assert.equal(gate.patchApplyAllowed, false);
  assert.equal(gate.authorityDecision.kind, 'cockpit_patch_authority_review_decision');
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = decideCockpitPatchAuthorityReview({
    intake,
    decision: 'approve',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:cockpit',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('cockpit_patch_authority_review_decision.decision_ref_required'));
}

function testDeferredDecisionBlocksGate(): void {
  const gate = decideCockpitPatchAuthorityReview({
    intake,
    decision: 'defer',
    decisionRef: 'decision:cockpit-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:cockpit',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('cockpit_patch_authority_review_decision.authority_defer'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testDeferredDecisionBlocksGate();

console.log('cockpitPatchAuthorityReviewDecisionGate tests passed');
