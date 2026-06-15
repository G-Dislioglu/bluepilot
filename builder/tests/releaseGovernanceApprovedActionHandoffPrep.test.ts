import assert from 'node:assert/strict';

import { prepareReleaseGovernanceApprovedActionHandoff } from '../src/releaseGovernanceApprovedActionHandoffPrep.js';
import type { ReleaseGovernanceFinalDecisionGate } from '../src/releaseGovernanceFinalDecisionGate.js';

const finalDecisionGate: ReleaseGovernanceFinalDecisionGate = {
  status: 'ready',
  finalDecisionGateAllowed: true,
  decision: 'approve',
  mergeAllowed: false,
  externalActionAllowed: false,
  decisionRef: 'decision:release-final',
  operatorRef: 'operator:release-manager',
  approvalRef: 'approval:release-final',
  releaseLabel: 'bpk-082-fixture',
  evidenceRefs: ['review-packets/BPK-082.md'],
  runbookSteps: ['record_manual_decision_without_executing_merge'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyHandoffPrep(): void {
  const prep = prepareReleaseGovernanceApprovedActionHandoff({
    finalDecisionGate,
    handoffPrepRef: 'handoff-prep:release-final',
    operatorRef: 'operator:release-manager',
    recipientRef: 'recipient:release-operator',
  });

  assert.equal(prep.status, 'ready');
  assert.equal(prep.handoffPrepAllowed, true);
  assert.equal(prep.mergeAllowed, false);
  assert.equal(prep.externalActionAllowed, false);
  assert.equal(prep.handoffPacket.kind, 'release_governance_approved_action');
}

function testMissingHandoffPrepRefRequiresReview(): void {
  const prep = prepareReleaseGovernanceApprovedActionHandoff({
    finalDecisionGate,
    operatorRef: 'operator:release-manager',
    recipientRef: 'recipient:release-operator',
  });

  assert.equal(prep.status, 'review_required');
  assert.ok(prep.reviewItems.includes('release_approved_handoff_prep.handoff_prep_ref_required'));
}

function testBlockedFinalDecisionBlocksHandoffPrep(): void {
  const prep = prepareReleaseGovernanceApprovedActionHandoff({
    finalDecisionGate: {
      ...finalDecisionGate,
      status: 'blocked',
      finalDecisionGateAllowed: false,
      decision: 'reject',
      blockers: ['release_final_decision.operator_rejected'],
    },
    handoffPrepRef: 'handoff-prep:release-final',
    operatorRef: 'operator:release-manager',
    recipientRef: 'recipient:release-operator',
  });

  assert.equal(prep.status, 'blocked');
  assert.ok(prep.blockers.includes('release_approved_handoff_prep.final_decision_not_allowed'));
  assert.ok(prep.blockers.includes('release_approved_handoff_prep.decision_must_be_approve'));
}

testReadyHandoffPrep();
testMissingHandoffPrepRefRequiresReview();
testBlockedFinalDecisionBlocksHandoffPrep();

console.log('releaseGovernanceApprovedActionHandoffPrep tests passed');
