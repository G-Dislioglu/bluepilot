import assert from 'node:assert/strict';

import { contractRuntimeExecutionRouteMount } from '../src/runtimeExecutionRouteMountContract.js';
import type { RuntimeExecutionRouteMountReadiness } from '../src/runtimeExecutionRouteMountReadiness.js';

const readiness: RuntimeExecutionRouteMountReadiness = {
  status: 'ready',
  mountAllowed: true,
  executionAllowed: false,
  serverMutationAllowed: false,
  mountRef: 'mount:BPK-041',
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyMountContract(): void {
  const contract = contractRuntimeExecutionRouteMount({
    readiness,
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
    handlerRef: 'handler:runtime-execution-contract-only',
  });

  assert.equal(contract.status, 'ready');
  assert.equal(contract.mountContractAllowed, true);
  assert.equal(contract.executionAllowed, false);
  assert.equal(contract.serverMutationAllowed, false);
}

function testMissingHandlerRequiresReview(): void {
  const contract = contractRuntimeExecutionRouteMount({
    readiness,
    envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  });

  assert.equal(contract.status, 'review_required');
  assert.ok(contract.reviewItems.includes('runtime_mount_contract.handler_ref_required'));
}

function testEnvMismatchBlocks(): void {
  const contract = contractRuntimeExecutionRouteMount({
    readiness,
    envGateName: 'BLUEPILOT_OTHER_ENABLED',
    handlerRef: 'handler:runtime-execution-contract-only',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('runtime_mount_contract.env_gate_mismatch:BLUEPILOT_OTHER_ENABLED->BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED'));
}

testReadyMountContract();
testMissingHandlerRequiresReview();
testEnvMismatchBlocks();

console.log('runtimeExecutionRouteMountContract tests passed');
