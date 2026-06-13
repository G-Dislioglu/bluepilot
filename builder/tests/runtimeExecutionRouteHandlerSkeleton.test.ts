import assert from 'node:assert/strict';

import { handleRuntimeExecutionRouteSkeleton } from '../src/runtimeExecutionRouteHandlerSkeleton.js';
import { RUNTIME_EXECUTION_ROUTE_CONFIRM } from '../src/runtimeExecutionRouteContract.js';
import type { RuntimeExecutionMountPreflight } from '../src/runtimeExecutionMountPreflight.js';
import type { RuntimeExecutionRouteMountContract } from '../src/runtimeExecutionRouteMountContract.js';

const preflight: RuntimeExecutionMountPreflight = {
  status: 'ready',
  executionMountPreflightReady: true,
  routeMutationAllowed: false,
  writeExecutionAllowed: false,
  proposedRoute: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  contractTaskId: 'BPK-runtime',
  blockers: [],
  reviewItems: [],
  checklist: [],
  nextActions: [],
};

const mountContract: RuntimeExecutionRouteMountContract = {
  status: 'ready',
  mountContractAllowed: true,
  executionAllowed: false,
  serverMutationAllowed: false,
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  handlerRef: 'handler:runtime-execution-skeleton',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyHandlerStillDoesNotExecute(): void {
  const result = handleRuntimeExecutionRouteSkeleton({
    method: 'POST',
    envEnabled: true,
    route: '/probe/runtime-dry-run-execution',
    body: {
      confirm: RUNTIME_EXECUTION_ROUTE_CONFIRM,
      instruction: 'dry run only',
    },
  }, preflight, mountContract);

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.executionAllowed, false);
  assert.equal(result.body.routeMutationAllowed, false);
  assert.equal(result.body.handlerRef, 'handler:runtime-execution-skeleton');
}

function testDisabledEnvStaysForbidden(): void {
  const result = handleRuntimeExecutionRouteSkeleton({
    method: 'POST',
    envEnabled: false,
    route: '/probe/runtime-dry-run-execution',
    body: {
      confirm: RUNTIME_EXECUTION_ROUTE_CONFIRM,
      instruction: 'dry run only',
    },
  }, preflight, mountContract);

  assert.equal(result.statusCode, 403);
  assert.equal(result.body.executionAllowed, false);
}

function testBlockedMountContractBlocksHandler(): void {
  const result = handleRuntimeExecutionRouteSkeleton({
    method: 'POST',
    envEnabled: true,
    route: '/probe/runtime-dry-run-execution',
    body: {
      confirm: RUNTIME_EXECUTION_ROUTE_CONFIRM,
      instruction: 'dry run only',
    },
  }, preflight, {
    ...mountContract,
    status: 'blocked',
    mountContractAllowed: false,
    blockers: ['runtime_mount_contract.mount_not_allowed'],
  });

  assert.equal(result.statusCode, 400);
  assert.ok(result.body.reasons.includes('runtime_execution_handler.mount_contract_not_allowed'));
}

testReadyHandlerStillDoesNotExecute();
testDisabledEnvStaysForbidden();
testBlockedMountContractBlocksHandler();

console.log('runtimeExecutionRouteHandlerSkeleton tests passed');
