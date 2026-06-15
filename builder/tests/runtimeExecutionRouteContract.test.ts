import assert from 'node:assert/strict';

import {
  buildRuntimeExecutionRouteContractResponse,
  RUNTIME_EXECUTION_ROUTE_CONFIRM,
} from '../src/runtimeExecutionRouteContract.js';
import type { RuntimeExecutionMountPreflight } from '../src/runtimeExecutionMountPreflight.js';

const preflight: RuntimeExecutionMountPreflight = {
  status: 'ready',
  executionMountPreflightReady: true,
  routeMutationAllowed: false,
  writeExecutionAllowed: false,
  proposedRoute: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  contractTaskId: 'BPK-runtime-execution',
  blockers: [],
  reviewItems: [],
  checklist: [],
  nextActions: [],
};

function testReadyContractNeverExecutes(): void {
  const response = buildRuntimeExecutionRouteContractResponse({
    method: 'POST',
    envEnabled: true,
    route: '/probe/runtime-dry-run-execution',
    body: {
      confirm: RUNTIME_EXECUTION_ROUTE_CONFIRM,
      instruction: 'Run dry-run execution later',
    },
  }, preflight);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.executionAllowed, false);
  assert.ok(response.body.reasons.includes('runtime_execution_route.contract_only_no_execution'));
}

function testDisabledEnvBlocks(): void {
  const response = buildRuntimeExecutionRouteContractResponse({
    method: 'POST',
    envEnabled: false,
    route: '/probe/runtime-dry-run-execution',
    body: {
      confirm: RUNTIME_EXECUTION_ROUTE_CONFIRM,
      instruction: 'Run dry-run execution later',
    },
  }, preflight);

  assert.equal(response.statusCode, 403);
  assert.ok(response.body.reasons.includes('runtime_execution_route.env_gate_required'));
}

function testRouteMismatchBlocks(): void {
  const response = buildRuntimeExecutionRouteContractResponse({
    method: 'POST',
    envEnabled: true,
    route: '/probe/runtime-dry-run',
    body: {
      confirm: RUNTIME_EXECUTION_ROUTE_CONFIRM,
      instruction: 'Run dry-run execution later',
    },
  }, preflight);

  assert.equal(response.statusCode, 400);
  assert.ok(response.body.reasons.includes('runtime_execution_route.route_mismatch:/probe/runtime-dry-run->/probe/runtime-dry-run-execution'));
}

function testMethodGuard(): void {
  const response = buildRuntimeExecutionRouteContractResponse({
    method: 'GET',
    envEnabled: true,
    route: '/probe/runtime-dry-run-execution',
  }, preflight);

  assert.equal(response.statusCode, 405);
}

testReadyContractNeverExecutes();
testDisabledEnvBlocks();
testRouteMismatchBlocks();
testMethodGuard();

console.log('runtimeExecutionRouteContract tests passed');
