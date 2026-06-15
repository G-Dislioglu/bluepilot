import assert from 'node:assert/strict';

import { evaluateCockpitPatchOperatorDecisionGate } from '../src/cockpitPatchOperatorDecisionGate.js';
import type { CockpitPatchOperatorDryRunEvidence } from '../src/cockpitPatchOperatorDryRunEvidence.js';

const evidence: CockpitPatchOperatorDryRunEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  evidenceRef: 'evidence:cockpit-dry-run',
  reviewerRef: 'reviewer:operator',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  simulatedSteps: ['stop_before_any_server_or_route_mutation'],
  evidenceRefs: ['review-packets/BPK-075.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = evaluateCockpitPatchOperatorDecisionGate({
    evidence,
    decision: 'approve',
    decisionRef: 'decision:cockpit-patch',
    operatorRef: 'operator:cockpit',
    approvalRef: 'approval:cockpit-patch',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.decisionGateAllowed, true);
  assert.equal(gate.patchApplyAllowed, false);
  assert.equal(gate.serverMutationExecuted, false);
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = evaluateCockpitPatchOperatorDecisionGate({
    evidence,
    decision: 'approve',
    operatorRef: 'operator:cockpit',
    approvalRef: 'approval:cockpit-patch',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('cockpit_patch_operator_decision.decision_ref_required'));
}

function testRejectedDecisionBlocksGate(): void {
  const gate = evaluateCockpitPatchOperatorDecisionGate({
    evidence,
    decision: 'reject',
    decisionRef: 'decision:cockpit-patch',
    operatorRef: 'operator:cockpit',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('cockpit_patch_operator_decision.operator_rejected'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testRejectedDecisionBlocksGate();

console.log('cockpitPatchOperatorDecisionGate tests passed');
