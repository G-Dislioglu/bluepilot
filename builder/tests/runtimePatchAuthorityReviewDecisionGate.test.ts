import assert from 'node:assert/strict';

import { decideRuntimePatchAuthorityReview } from '../src/runtimePatchAuthorityReviewDecisionGate.js';
import type { RuntimePatchAuthorityReviewIntake } from '../src/runtimePatchAuthorityReviewIntake.js';

const intake: RuntimePatchAuthorityReviewIntake = {
  status: 'ready',
  authorityReviewIntakeAllowed: true,
  permitIssued: false,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  authorityReviewRef: 'authority-review:runtime',
  reviewerRef: 'authority:operator',
  intakeEvidenceRef: 'review-packets/BPK-101.md',
  routePath: '/probe/runtime-execution',
  envGateName: 'BLUEPILOT_RUNTIME_EXECUTION_ROUTE_ENABLED',
  proposedFiles: ['builder/src/server.ts'],
  evidenceRefs: ['review-packets/BPK-101.md'],
  authorityReview: {
    kind: 'runtime_patch_authority_review_intake',
    requestKind: 'runtime_patch_permit_issuance_request',
    permitKind: 'runtime_patch_application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = decideRuntimePatchAuthorityReview({
    intake,
    decision: 'approve',
    decisionRef: 'decision:runtime-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:runtime',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.authorityDecisionGateAllowed, true);
  assert.equal(gate.permitIssued, false);
  assert.equal(gate.executionAllowed, false);
  assert.equal(gate.authorityDecision.kind, 'runtime_patch_authority_review_decision');
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = decideRuntimePatchAuthorityReview({
    intake,
    decision: 'approve',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:runtime',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('runtime_patch_authority_review_decision.decision_ref_required'));
}

function testDeferredDecisionBlocksGate(): void {
  const gate = decideRuntimePatchAuthorityReview({
    intake,
    decision: 'defer',
    decisionRef: 'decision:runtime-authority',
    authorityRef: 'authority:operator',
    rationaleRef: 'rationale:runtime',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('runtime_patch_authority_review_decision.authority_defer'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testDeferredDecisionBlocksGate();

console.log('runtimePatchAuthorityReviewDecisionGate tests passed');
