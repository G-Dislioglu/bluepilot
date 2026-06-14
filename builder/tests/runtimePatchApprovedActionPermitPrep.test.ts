import assert from 'node:assert/strict';

import { prepareRuntimePatchApprovedActionPermit } from '../src/runtimePatchApprovedActionPermitPrep.js';
import type { RuntimePatchOperatorDecisionGate } from '../src/runtimePatchOperatorDecisionGate.js';

const decisionGate: RuntimePatchOperatorDecisionGate = {
  status: 'ready',
  decisionGateAllowed: true,
  decision: 'approve',
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  decisionRef: 'decision:runtime-patch',
  operatorRef: 'operator:runtime',
  approvalRef: 'approval:runtime-patch',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  evidenceRefs: ['review-packets/BPK-081.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPermitPrep(): void {
  const prep = prepareRuntimePatchApprovedActionPermit({
    decisionGate,
    permitPrepRef: 'permit-prep:runtime-patch',
    requesterRef: 'requester:operator',
    scopeRef: 'scope:runtime-patch',
  });

  assert.equal(prep.status, 'ready');
  assert.equal(prep.permitPrepAllowed, true);
  assert.equal(prep.permitIssued, false);
  assert.equal(prep.executionAllowed, false);
  assert.equal(prep.permitRequest.kind, 'runtime_patch_application');
}

function testMissingPermitPrepRefRequiresReview(): void {
  const prep = prepareRuntimePatchApprovedActionPermit({
    decisionGate,
    requesterRef: 'requester:operator',
    scopeRef: 'scope:runtime-patch',
  });

  assert.equal(prep.status, 'review_required');
  assert.ok(prep.reviewItems.includes('runtime_patch_permit_prep.permit_prep_ref_required'));
}

function testRejectedDecisionBlocksPermitPrep(): void {
  const prep = prepareRuntimePatchApprovedActionPermit({
    decisionGate: {
      ...decisionGate,
      status: 'blocked',
      decisionGateAllowed: false,
      decision: 'reject',
      blockers: ['runtime_patch_operator_decision.operator_rejected'],
    },
    permitPrepRef: 'permit-prep:runtime-patch',
    requesterRef: 'requester:operator',
    scopeRef: 'scope:runtime-patch',
  });

  assert.equal(prep.status, 'blocked');
  assert.ok(prep.blockers.includes('runtime_patch_permit_prep.decision_gate_not_allowed'));
  assert.ok(prep.blockers.includes('runtime_patch_permit_prep.decision_must_be_approve'));
}

testReadyPermitPrep();
testMissingPermitPrepRefRequiresReview();
testRejectedDecisionBlocksPermitPrep();

console.log('runtimePatchApprovedActionPermitPrep tests passed');
