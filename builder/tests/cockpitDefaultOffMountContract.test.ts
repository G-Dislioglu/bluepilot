import assert from 'node:assert/strict';

import { contractCockpitDefaultOffMount } from '../src/cockpitDefaultOffMountContract.js';
import type { CockpitHandlerMountReadiness } from '../src/cockpitHandlerMountReadiness.js';

const readiness: CockpitHandlerMountReadiness = {
  status: 'ready',
  mountReadinessAllowed: true,
  serverMutationAllowed: false,
  routeMutationAllowed: false,
  executableActionAllowed: false,
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  routeModuleRef: 'builder/src/cockpitReadOnlyRoute.ts',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyDefaultOffMountContract(): void {
  const contract = contractCockpitDefaultOffMount({
    readiness,
    envCurrentlyEnabled: false,
    mountContractRef: 'mount-contract:cockpit-default-off',
  });

  assert.equal(contract.status, 'ready');
  assert.equal(contract.mountContractAllowed, true);
  assert.equal(contract.defaultOff, true);
  assert.equal(contract.serverMutationAllowed, false);
  assert.equal(contract.executableActionAllowed, false);
}

function testEnabledEnvBlocksContract(): void {
  const contract = contractCockpitDefaultOffMount({
    readiness,
    envCurrentlyEnabled: true,
    mountContractRef: 'mount-contract:cockpit-default-off',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('cockpit_default_off_mount.env_gate_must_be_default_off:BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED'));
}

function testBlockedReadinessBlocksContract(): void {
  const contract = contractCockpitDefaultOffMount({
    readiness: {
      ...readiness,
      status: 'blocked',
      mountReadinessAllowed: false,
      blockers: ['cockpit_handler_mount.model_actions_must_stay_disabled'],
    },
    envCurrentlyEnabled: false,
    mountContractRef: 'mount-contract:cockpit-default-off',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('cockpit_default_off_mount.readiness_not_allowed'));
}

testReadyDefaultOffMountContract();
testEnabledEnvBlocksContract();
testBlockedReadinessBlocksContract();

console.log('cockpitDefaultOffMountContract tests passed');
