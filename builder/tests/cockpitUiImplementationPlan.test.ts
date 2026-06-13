import assert from 'node:assert/strict';

import type { CockpitProjectionAdoptionContract } from '../src/cockpitProjectionAdoptionContract.js';
import { planCockpitUiImplementation } from '../src/cockpitUiImplementationPlan.js';

const cockpit: CockpitProjectionAdoptionContract = {
  status: 'ready',
  cockpitModelAllowed: true,
  executableActionAllowed: false,
  audience: 'operator',
  contractTaskId: 'BPK-903',
  reasons: [],
  headline: 'Ready for operator inspection',
  panels: [
    { id: 'readiness.dispatch_decision', title: 'Dispatch decision', status: 'ready', lines: ['dispatch_allowed:true'] },
    { id: 'runtime.integration', title: 'Runtime integration', status: 'ready', lines: ['status:runtime_candidate'] },
  ],
  actions: [
    { id: 'open_runtime_dispatch', enabled: false, reason: 'contract_only' },
  ],
};

function testReadyPlan(): void {
  const plan = planCockpitUiImplementation({ cockpit });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.implementationAllowed, true);
  assert.equal(plan.targetSurface, 'responsive');
  assert.deepEqual(plan.blockers, []);
  assert.equal(plan.screens[0].sourcePanelIds.length, 2);
  assert.ok(plan.visualEvidenceGates.includes('screenshot_desktop'));
  assert.equal(plan.controls[0].enabled, false);
}

function testReviewPlan(): void {
  const plan = planCockpitUiImplementation({
    cockpit: { ...cockpit, status: 'review', headline: 'Operator review required' },
    targetSurface: 'desktop',
  });

  assert.equal(plan.status, 'review_required');
  assert.equal(plan.implementationAllowed, true);
  assert.equal(plan.targetSurface, 'desktop');
  assert.ok(plan.reviewItems.includes('cockpit_ui.review_state_requires_review_affordance'));
}

function testInvalidModelBlocks(): void {
  const plan = planCockpitUiImplementation({
    cockpit: { ...cockpit, status: 'invalid', cockpitModelAllowed: false },
  });

  assert.equal(plan.status, 'blocked');
  assert.equal(plan.implementationAllowed, false);
  assert.ok(plan.blockers.includes('cockpit_ui.model_not_allowed'));
  assert.ok(plan.blockers.includes('cockpit_ui.invalid_projection'));
}

function testExecutableActionGuardBlocks(): void {
  const plan = planCockpitUiImplementation({
    cockpit: { ...cockpit, executableActionAllowed: true as false },
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('cockpit_ui.executable_action_must_remain_disabled'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify(cockpit);
  planCockpitUiImplementation({ cockpit });
  assert.equal(JSON.stringify(cockpit), before);
}

testReadyPlan();
testReviewPlan();
testInvalidModelBlocks();
testExecutableActionGuardBlocks();
testDoesNotMutateInputs();

console.log('cockpitUiImplementationPlan tests passed');
