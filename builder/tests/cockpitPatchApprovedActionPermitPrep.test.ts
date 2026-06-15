import assert from 'node:assert/strict';

import { prepareCockpitPatchApprovedActionPermit } from '../src/cockpitPatchApprovedActionPermitPrep.js';
import type { CockpitPatchOperatorDecisionGate } from '../src/cockpitPatchOperatorDecisionGate.js';

const decisionGate: CockpitPatchOperatorDecisionGate = {
  status: 'ready',
  decisionGateAllowed: true,
  decision: 'approve',
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  decisionRef: 'decision:cockpit-patch',
  operatorRef: 'operator:cockpit',
  approvalRef: 'approval:cockpit-patch',
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  evidenceRefs: ['review-packets/BPK-079.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPermitPrep(): void {
  const prep = prepareCockpitPatchApprovedActionPermit({
    decisionGate,
    permitPrepRef: 'permit-prep:cockpit-patch',
    requesterRef: 'requester:operator',
    scopeRef: 'scope:cockpit-patch',
  });

  assert.equal(prep.status, 'ready');
  assert.equal(prep.permitPrepAllowed, true);
  assert.equal(prep.permitIssued, false);
  assert.equal(prep.patchApplyAllowed, false);
  assert.equal(prep.permitRequest.kind, 'cockpit_patch_application');
}

function testMissingPermitPrepRefRequiresReview(): void {
  const prep = prepareCockpitPatchApprovedActionPermit({
    decisionGate,
    requesterRef: 'requester:operator',
    scopeRef: 'scope:cockpit-patch',
  });

  assert.equal(prep.status, 'review_required');
  assert.ok(prep.reviewItems.includes('cockpit_patch_permit_prep.permit_prep_ref_required'));
}

function testRejectedDecisionBlocksPermitPrep(): void {
  const prep = prepareCockpitPatchApprovedActionPermit({
    decisionGate: {
      ...decisionGate,
      status: 'blocked',
      decisionGateAllowed: false,
      decision: 'reject',
      blockers: ['cockpit_patch_operator_decision.operator_rejected'],
    },
    permitPrepRef: 'permit-prep:cockpit-patch',
    requesterRef: 'requester:operator',
    scopeRef: 'scope:cockpit-patch',
  });

  assert.equal(prep.status, 'blocked');
  assert.ok(prep.blockers.includes('cockpit_patch_permit_prep.decision_gate_not_allowed'));
  assert.ok(prep.blockers.includes('cockpit_patch_permit_prep.decision_must_be_approve'));
}

testReadyPermitPrep();
testMissingPermitPrepRefRequiresReview();
testRejectedDecisionBlocksPermitPrep();

console.log('cockpitPatchApprovedActionPermitPrep tests passed');
