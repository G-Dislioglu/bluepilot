import assert from 'node:assert/strict';

import { contractRuntimeDefaultOffMount } from '../src/runtimeDefaultOffMountContract.js';
import type { RuntimeHandlerMountReadiness } from '../src/runtimeHandlerMountReadiness.js';

const readiness: RuntimeHandlerMountReadiness = {
  status: 'ready',
  mountReadinessAllowed: true,
  executionAllowed: false,
  serverMutationAllowed: false,
  routeMutationAllowed: false,
  routePath: '/probe/runtime-dry-run-execution',
  envGateName: 'BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED',
  handlerRef: 'handler:runtime-execution-skeleton',
  routeModuleRef: 'builder/src/runtimeExecutionRoute.ts',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyDefaultOffRuntimeMountContract(): void {
  const contract = contractRuntimeDefaultOffMount({
    readiness,
    envCurrentlyEnabled: false,
    mountContractRef: 'mount-contract:runtime-default-off',
  });

  assert.equal(contract.status, 'ready');
  assert.equal(contract.mountContractAllowed, true);
  assert.equal(contract.defaultOff, true);
  assert.equal(contract.executionAllowed, false);
  assert.equal(contract.serverMutationAllowed, false);
}

function testEnabledEnvBlocksRuntimeContract(): void {
  const contract = contractRuntimeDefaultOffMount({
    readiness,
    envCurrentlyEnabled: true,
    mountContractRef: 'mount-contract:runtime-default-off',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('runtime_default_off_mount.env_gate_must_be_default_off:BLUEPILOT_RUNTIME_DRY_RUN_EXECUTION_ENABLED'));
}

function testBlockedReadinessBlocksRuntimeContract(): void {
  const contract = contractRuntimeDefaultOffMount({
    readiness: {
      ...readiness,
      status: 'blocked',
      mountReadinessAllowed: false,
      blockers: ['runtime_handler_mount.handler_execution_must_stay_disabled'],
    },
    envCurrentlyEnabled: false,
    mountContractRef: 'mount-contract:runtime-default-off',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('runtime_default_off_mount.readiness_not_allowed'));
}

testReadyDefaultOffRuntimeMountContract();
testEnabledEnvBlocksRuntimeContract();
testBlockedReadinessBlocksRuntimeContract();

console.log('runtimeDefaultOffMountContract tests passed');
