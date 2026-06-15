import assert from 'node:assert/strict';

import { preflightRuntimeMountPatch } from '../src/runtimeMountPatchPreflight.js';
import type { RuntimeMountImplementationPlan } from '../src/runtimeMountImplementationPlan.js';

const plan: RuntimeMountImplementationPlan = {
  status: 'ready',
  implementationPlanAllowed: true,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  implementationPlanRef: 'plan:runtime-mount',
  reviewerRef: 'reviewer:operator',
  plannedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  requiredGates: ['BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED', 'runtime_execution_allowed_false_until_separate_contract'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRuntimePatchPreflight(): void {
  const preflight = preflightRuntimeMountPatch({
    plan,
    proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
    routePath: '/probe/runtime-dry-run-execution',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    reviewerRef: 'reviewer:operator',
    patchRef: 'patch:runtime-mount',
    executionStillClosed: true,
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.patchPreflightAllowed, true);
  assert.equal(preflight.executionExecuted, false);
}

function testUnplannedFileBlocksRuntimePatchPreflight(): void {
  const preflight = preflightRuntimeMountPatch({
    plan,
    proposedFiles: ['builder/src/server.ts', 'builder/src/opusTaskOrchestrator.ts'],
    routePath: '/probe/runtime-dry-run-execution',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    reviewerRef: 'reviewer:operator',
    patchRef: 'patch:runtime-mount',
    executionStillClosed: true,
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_mount_patch_preflight.unplanned_file:builder/src/opusTaskOrchestrator.ts'));
}

function testExecutionOpenBlocksRuntimePatchPreflight(): void {
  const preflight = preflightRuntimeMountPatch({
    plan,
    proposedFiles: ['builder/src/server.ts'],
    routePath: '/probe/runtime-dry-run-execution',
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    reviewerRef: 'reviewer:operator',
    patchRef: 'patch:runtime-mount',
    executionStillClosed: false,
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('runtime_mount_patch_preflight.execution_must_remain_closed'));
}

testReadyRuntimePatchPreflight();
testUnplannedFileBlocksRuntimePatchPreflight();
testExecutionOpenBlocksRuntimePatchPreflight();

console.log('runtimeMountPatchPreflight tests passed');
