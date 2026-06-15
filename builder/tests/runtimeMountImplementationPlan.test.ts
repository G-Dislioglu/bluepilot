import assert from 'node:assert/strict';

import { planRuntimeMountImplementation } from '../src/runtimeMountImplementationPlan.js';
import type { RuntimeDefaultOffMountContract } from '../src/runtimeDefaultOffMountContract.js';

const contract: RuntimeDefaultOffMountContract = {
  status: 'ready',
  mountContractAllowed: true,
  executionAllowed: false,
  serverMutationAllowed: false,
  routeMutationAllowed: false,
  defaultOff: true,
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  handlerRef: 'handler:runtime-execution-skeleton',
  routeModuleRef: 'builder/src/runtimeExecutionRoute.ts',
  mountContractRef: 'mount-contract:runtime-default-off',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRuntimePlan(): void {
  const plan = planRuntimeMountImplementation({
    contract,
    reviewerRef: 'reviewer:operator',
    implementationPlanRef: 'plan:runtime-mount',
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.implementationPlanAllowed, true);
  assert.equal(plan.executionExecuted, false);
  assert.ok(plan.requiredGates.includes('runtime_execution_allowed_false_until_separate_contract'));
}

function testMissingReviewerRequiresReview(): void {
  const plan = planRuntimeMountImplementation({
    contract,
    implementationPlanRef: 'plan:runtime-mount',
  });

  assert.equal(plan.status, 'review_required');
  assert.ok(plan.reviewItems.includes('runtime_mount_plan.reviewer_ref_required'));
}

function testBlockedContractBlocksPlan(): void {
  const plan = planRuntimeMountImplementation({
    contract: {
      ...contract,
      status: 'blocked',
      mountContractAllowed: false,
      blockers: ['runtime_default_off_mount.env_gate_must_be_default_off:BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED'],
    },
    reviewerRef: 'reviewer:operator',
    implementationPlanRef: 'plan:runtime-mount',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('runtime_mount_plan.mount_contract_not_allowed'));
}

testReadyRuntimePlan();
testMissingReviewerRequiresReview();
testBlockedContractBlocksPlan();

console.log('runtimeMountImplementationPlan tests passed');
