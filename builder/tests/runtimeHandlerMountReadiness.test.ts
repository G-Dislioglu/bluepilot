import assert from 'node:assert/strict';

import { assessRuntimeHandlerMountReadiness } from '../src/runtimeHandlerMountReadiness.js';
import type { RuntimeExecutionRouteHandlerSkeletonResult } from '../src/runtimeExecutionRouteHandlerSkeleton.js';
import type { RuntimeExecutionRouteMountContract } from '../src/runtimeExecutionRouteMountContract.js';

const handlerResult: RuntimeExecutionRouteHandlerSkeletonResult = {
  statusCode: 200,
  body: {
    ok: true,
    code: 'runtime_execution_route_contract_ready',
    executionAllowed: false,
    routeMutationAllowed: false,
    handlerRef: 'handler:runtime-execution-skeleton',
    reasons: [
      'runtime_execution_route.contract_only_no_execution',
      'runtime_execution_handler.skeleton_only_no_execution',
    ],
  },
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

function testReadyRuntimeMountReadiness(): void {
  const readiness = assessRuntimeHandlerMountReadiness({
    handlerResult,
    mountContract,
    routeModuleRef: 'builder/src/runtimeExecutionRoute.ts',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.mountReadinessAllowed, true);
  assert.equal(readiness.executionAllowed, false);
  assert.equal(readiness.serverMutationAllowed, false);
}

function testMissingRouteModuleRequiresReview(): void {
  const readiness = assessRuntimeHandlerMountReadiness({
    handlerResult,
    mountContract,
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('runtime_handler_mount.route_module_ref_required'));
}

function testHandlerExecutionAllowedBlocksReadiness(): void {
  const readiness = assessRuntimeHandlerMountReadiness({
    handlerResult: {
      ...handlerResult,
      body: {
        ...handlerResult.body,
        executionAllowed: true as false,
      },
    },
    mountContract,
    routeModuleRef: 'builder/src/runtimeExecutionRoute.ts',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('runtime_handler_mount.handler_execution_must_stay_disabled'));
}

testReadyRuntimeMountReadiness();
testMissingRouteModuleRequiresReview();
testHandlerExecutionAllowedBlocksReadiness();

console.log('runtimeHandlerMountReadiness tests passed');
