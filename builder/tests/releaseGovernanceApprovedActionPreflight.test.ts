import assert from 'node:assert/strict';

import { preflightReleaseGovernanceApprovedAction } from '../src/releaseGovernanceApprovedActionPreflight.js';
import type { ReleaseGovernanceAuthorityReviewDecisionGate } from '../src/releaseGovernanceAuthorityReviewDecisionGate.js';

const decisionGate: ReleaseGovernanceAuthorityReviewDecisionGate = {
  status: 'ready',
  authorityDecisionGateAllowed: true,
  decision: 'approve',
  mergeAllowed: false,
  externalActionAllowed: false,
  decisionRef: 'decision:release-authority',
  authorityRef: 'authority:operator',
  rationaleRef: 'rationale:release',
  releaseLabel: 'bpk-103-106-authority-review-decision-gates',
  evidenceRefs: ['review-packets/BPK-106.md'],
  runbookSteps: ['verify_checks'],
  authorityDecision: {
    kind: 'release_governance_authority_review_decision',
    requestKind: 'release_governance_approved_action_request',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedAction({
    decisionGate,
    preflightRef: 'preflight:release',
    executorRef: 'executor:authority',
    actionPolicyRef: 'policy:release-action',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.approvedActionPreflightAllowed, true);
  assert.equal(preflight.mergeAllowed, false);
  assert.equal(preflight.externalActionAllowed, false);
  assert.equal(preflight.approvedAction.kind, 'release_governance_approved_action_preflight');
}

function testMissingPreflightRefRequiresReview(): void {
  const preflight = preflightReleaseGovernanceApprovedAction({
    decisionGate,
    executorRef: 'executor:authority',
    actionPolicyRef: 'policy:release-action',
  });

  assert.equal(preflight.status, 'review_required');
  assert.ok(preflight.reviewItems.includes('release_governance_approved_action_preflight.preflight_ref_required'));
}

function testDeferredDecisionBlocksPreflight(): void {
  const preflight = preflightReleaseGovernanceApprovedAction({
    decisionGate: { ...decisionGate, status: 'blocked', authorityDecisionGateAllowed: false, decision: 'defer', blockers: ['deferred'] },
    preflightRef: 'preflight:release',
    executorRef: 'executor:authority',
    actionPolicyRef: 'policy:release-action',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('release_governance_approved_action_preflight.decision_gate_not_allowed'));
}

testReadyPreflight();
testMissingPreflightRefRequiresReview();
testDeferredDecisionBlocksPreflight();

console.log('releaseGovernanceApprovedActionPreflight tests passed');
