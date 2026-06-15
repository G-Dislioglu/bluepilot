import assert from 'node:assert/strict';

import { evaluateRuntimePatchOperatorDecisionGate } from '../src/runtimePatchOperatorDecisionGate.js';
import type { RuntimePatchOperatorDryRunEvidence } from '../src/runtimePatchOperatorDryRunEvidence.js';

const evidence: RuntimePatchOperatorDryRunEvidence = {
  status: 'ready',
  evidencePackAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  evidenceRef: 'evidence:runtime-dry-run',
  reviewerRef: 'reviewer:operator',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  simulatedSteps: ['stop_before_any_server_route_or_execution_mutation'],
  evidenceRefs: ['review-packets/BPK-077.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testApprovedDecisionGate(): void {
  const gate = evaluateRuntimePatchOperatorDecisionGate({
    evidence,
    decision: 'approve',
    decisionRef: 'decision:runtime-patch',
    operatorRef: 'operator:runtime',
    approvalRef: 'approval:runtime-patch',
  });

  assert.equal(gate.status, 'ready');
  assert.equal(gate.decisionGateAllowed, true);
  assert.equal(gate.patchApplyAllowed, false);
  assert.equal(gate.executionAllowed, false);
}

function testMissingDecisionRefRequiresReview(): void {
  const gate = evaluateRuntimePatchOperatorDecisionGate({
    evidence,
    decision: 'approve',
    operatorRef: 'operator:runtime',
    approvalRef: 'approval:runtime-patch',
  });

  assert.equal(gate.status, 'review_required');
  assert.ok(gate.reviewItems.includes('runtime_patch_operator_decision.decision_ref_required'));
}

function testRejectedDecisionBlocksGate(): void {
  const gate = evaluateRuntimePatchOperatorDecisionGate({
    evidence,
    decision: 'reject',
    decisionRef: 'decision:runtime-patch',
    operatorRef: 'operator:runtime',
  });

  assert.equal(gate.status, 'blocked');
  assert.ok(gate.blockers.includes('runtime_patch_operator_decision.operator_rejected'));
}

testApprovedDecisionGate();
testMissingDecisionRefRequiresReview();
testRejectedDecisionBlocksGate();

console.log('runtimePatchOperatorDecisionGate tests passed');
