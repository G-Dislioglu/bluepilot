import assert from 'node:assert/strict';

import { evaluateReleaseGovernanceFinalDecisionGate } from '../src/releaseGovernanceFinalDecisionGate.js';
import type { ReleaseGovernanceRunbookEvidence } from '../src/releaseGovernanceRunbookEvidence.js';

const evidence: ReleaseGovernanceRunbookEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  mergeAllowed: false,
  externalActionAllowed: false,
  evidenceRef: 'evidence:release-runbook',
  reviewerRef: 'reviewer:release-governance',
  handoffRef: 'handoff:operator',
  releaseLabel: 'bpk-078-fixture',
  evidenceRefs: ['review-packets/BPK-078.md'],
  runbookSteps: ['record_manual_decision_without_executing_merge'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = evaluateReleaseGovernanceFinalDecisionGate({
    evidence,
    decision: 'approve',
    decisionRef: 'decision:release-final',
    operatorRef: 'operator:release-manager',
    approvalRef: 'approval:release-final',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.finalDecisionGateAllowed, true);
  assert.equal(gate.mergeAllowed, false);
  assert.equal(gate.externalActionAllowed, false);
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = evaluateReleaseGovernanceFinalDecisionGate({
    evidence,
    decision: 'approve',
    operatorRef: 'operator:release-manager',
    approvalRef: 'approval:release-final',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('release_final_decision.decision_ref_required'));
}

function testBlockedEvidenceBlocksDecisionGate(): void {
  const gate = evaluateReleaseGovernanceFinalDecisionGate({
    evidence: {
      ...evidence,
      status: 'blocked',
      evidencePackAllowed: false,
      blockers: ['release_runbook_evidence.runbook_not_allowed'],
    },
    decision: 'approve',
    decisionRef: 'decision:release-final',
    operatorRef: 'operator:release-manager',
    approvalRef: 'approval:release-final',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('release_final_decision.evidence_not_allowed'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testBlockedEvidenceBlocksDecisionGate();

console.log('releaseGovernanceFinalDecisionGate tests passed');
