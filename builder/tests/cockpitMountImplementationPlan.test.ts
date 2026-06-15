import assert from 'node:assert/strict';

import { planCockpitMountImplementation } from '../src/cockpitMountImplementationPlan.js';
import type { CockpitDefaultOffMountContract } from '../src/cockpitDefaultOffMountContract.js';

const contract: CockpitDefaultOffMountContract = {
  status: 'ready',
  mountContractAllowed: true,
  serverMutationAllowed: false,
  routeMutationAllowed: false,
  executableActionAllowed: false,
  defaultOff: true,
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  routeModuleRef: 'builder/src/cockpitReadOnlyRoute.ts',
  mountContractRef: 'mount-contract:cockpit-default-off',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyCockpitPlan(): void {
  const plan = planCockpitMountImplementation({
    contract,
    reviewerRef: 'reviewer:operator',
    implementationPlanRef: 'plan:cockpit-mount',
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.implementationPlanAllowed, true);
  assert.equal(plan.serverMutationExecuted, false);
  assert.ok(plan.plannedFiles.includes('builder/src/server.ts'));
}

function testMissingReviewerRequiresReview(): void {
  const plan = planCockpitMountImplementation({
    contract,
    implementationPlanRef: 'plan:cockpit-mount',
  });

  assert.equal(plan.status, 'review_required');
  assert.ok(plan.reviewItems.includes('cockpit_mount_plan.reviewer_ref_required'));
}

function testBlockedContractBlocksPlan(): void {
  const plan = planCockpitMountImplementation({
    contract: {
      ...contract,
      status: 'blocked',
      mountContractAllowed: false,
      blockers: ['cockpit_default_off_mount.env_gate_must_be_default_off:BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED'],
    },
    reviewerRef: 'reviewer:operator',
    implementationPlanRef: 'plan:cockpit-mount',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('cockpit_mount_plan.mount_contract_not_allowed'));
}

testReadyCockpitPlan();
testMissingReviewerRequiresReview();
testBlockedContractBlocksPlan();

console.log('cockpitMountImplementationPlan tests passed');
