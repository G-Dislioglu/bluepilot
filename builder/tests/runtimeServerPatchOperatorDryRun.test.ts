import assert from 'node:assert/strict';

import { planRuntimeServerPatchOperatorDryRun } from '../src/runtimeServerPatchOperatorDryRun.js';
import type { RuntimeServerPatchApplicationReadiness } from '../src/runtimeServerPatchApplicationReadiness.js';

const readiness: RuntimeServerPatchApplicationReadiness = {
  status: 'ready',
  applicationReadinessAllowed: true,
  patchApplyAllowed: false,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executionExecuted: false,
  executionAllowed: false,
  readinessRef: 'readiness:runtime-patch',
  operatorApprovalRef: 'approval:operator',
  diffRef: 'diff:runtime-patch',
  executionClosedRef: 'execution-closed:runtime',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  proposedFiles: ['builder/src/server.ts', 'builder/src/runtimeExecutionRoute.ts'],
  guardChecks: ['execution_allowed_false'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRuntimeOperatorDryRun(): void {
  const dryRun = planRuntimeServerPatchOperatorDryRun({
    readiness,
    dryRunRef: 'dry-run:runtime-patch',
    operatorRef: 'operator:runtime',
    simulationRef: 'simulation:runtime-patch',
  });

  assert.equal(dryRun.status, 'ready');
  assert.equal(dryRun.dryRunAllowed, true);
  assert.equal(dryRun.patchApplyAllowed, false);
  assert.equal(dryRun.executionExecuted, false);
  assert.equal(dryRun.executionAllowed, false);
  assert.ok(dryRun.simulatedSteps.includes('stop_before_any_server_route_or_execution_mutation'));
}

function testMissingDryRunRefRequiresReview(): void {
  const dryRun = planRuntimeServerPatchOperatorDryRun({
    readiness,
    operatorRef: 'operator:runtime',
    simulationRef: 'simulation:runtime-patch',
  });

  assert.equal(dryRun.status, 'review_required');
  assert.ok(dryRun.reviewItems.includes('runtime_patch_operator_dry_run.dry_run_ref_required'));
}

function testBlockedReadinessBlocksDryRun(): void {
  const dryRun = planRuntimeServerPatchOperatorDryRun({
    readiness: {
      ...readiness,
      status: 'blocked',
      applicationReadinessAllowed: false,
      blockers: ['runtime_patch_application_readiness.candidate_not_allowed'],
    },
    dryRunRef: 'dry-run:runtime-patch',
    operatorRef: 'operator:runtime',
    simulationRef: 'simulation:runtime-patch',
  });

  assert.equal(dryRun.status, 'blocked');
  assert.ok(dryRun.blockers.includes('runtime_patch_operator_dry_run.readiness_not_allowed'));
}

testReadyRuntimeOperatorDryRun();
testMissingDryRunRefRequiresReview();
testBlockedReadinessBlocksDryRun();

console.log('runtimeServerPatchOperatorDryRun tests passed');
