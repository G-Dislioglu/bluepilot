import assert from 'node:assert/strict';

import { assessRuntimeExecutionRouteMountReadiness } from '../src/runtimeExecutionRouteMountReadiness.js';
import type { RuntimeExecutionMountPreflight } from '../src/runtimeExecutionMountPreflight.js';
import type { RuntimeExecutionRouteContractResponse } from '../src/runtimeExecutionRouteContract.js';

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

const response: RuntimeExecutionRouteContractResponse = {
  statusCode: 200,
  body: {
    ok: true,
    code: 'runtime_execution_route_contract_ready',
    executionAllowed: false,
    reasons: ['runtime_execution_route.contract_only_no_execution'],
    preflight,
  },
};

function testMountReadinessReady(): void {
  const readiness = assessRuntimeExecutionRouteMountReadiness({
    preflight,
    contractResponse: response,
    mountRef: 'mount:BPK-037',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.mountAllowed, true);
  assert.equal(readiness.executionAllowed, false);
  assert.equal(readiness.serverMutationAllowed, false);
}

function testMissingMountRefRequiresReview(): void {
  const readiness = assessRuntimeExecutionRouteMountReadiness({ preflight, contractResponse: response });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('runtime_mount_readiness.mount_ref_required'));
}

function testContractNotReadyBlocks(): void {
  const readiness = assessRuntimeExecutionRouteMountReadiness({
    preflight,
    contractResponse: {
      ...response,
      statusCode: 400,
      body: {
        ...response.body,
        ok: false,
        reasons: ['runtime_execution_route.confirm_required'],
      },
    },
    mountRef: 'mount:BPK-037',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('runtime_mount_readiness.contract_not_ready:runtime_execution_route.confirm_required'));
}

testMountReadinessReady();
testMissingMountRefRequiresReview();
testContractNotReadyBlocks();

console.log('runtimeExecutionRouteMountReadiness tests passed');
