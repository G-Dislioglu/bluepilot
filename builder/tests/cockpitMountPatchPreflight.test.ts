import assert from 'node:assert/strict';

import { preflightCockpitMountPatch } from '../src/cockpitMountPatchPreflight.js';
import type { CockpitMountImplementationPlan } from '../src/cockpitMountImplementationPlan.js';

const plan: CockpitMountImplementationPlan = {
  status: 'ready',
  implementationPlanAllowed: true,
  serverMutationExecuted: false,
  routeMutationExecuted: false,
  executableActionAllowed: false,
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  implementationPlanRef: 'plan:cockpit-mount',
  reviewerRef: 'reviewer:operator',
  plannedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
  requiredGates: ['BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED', 'actions_remain_disabled'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyCockpitPatchPreflight(): void {
  const preflight = preflightCockpitMountPatch({
    plan,
    proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyRoute.ts'],
    routePath: '/cockpit/read-only',
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    reviewerRef: 'reviewer:operator',
    patchRef: 'patch:cockpit-mount',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.patchPreflightAllowed, true);
  assert.equal(preflight.serverMutationExecuted, false);
  assert.equal(preflight.executableActionAllowed, false);
}

function testUnplannedFileBlocksCockpitPatchPreflight(): void {
  const preflight = preflightCockpitMountPatch({
    plan,
    proposedFiles: ['builder/src/server.ts', 'builder/src/cockpitReadOnlyHtml.ts'],
    routePath: '/cockpit/read-only',
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    reviewerRef: 'reviewer:operator',
    patchRef: 'patch:cockpit-mount',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('cockpit_mount_patch_preflight.unplanned_file:builder/src/cockpitReadOnlyHtml.ts'));
}

function testBlockedPlanBlocksCockpitPatchPreflight(): void {
  const preflight = preflightCockpitMountPatch({
    plan: {
      ...plan,
      status: 'blocked',
      implementationPlanAllowed: false,
      blockers: ['cockpit_mount_plan.mount_contract_not_allowed'],
    },
    proposedFiles: ['builder/src/server.ts'],
    routePath: '/cockpit/read-only',
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    reviewerRef: 'reviewer:operator',
    patchRef: 'patch:cockpit-mount',
  });

  assert.equal(preflight.status, 'blocked');
  assert.ok(preflight.blockers.includes('cockpit_mount_patch_preflight.plan_not_allowed'));
}

testReadyCockpitPatchPreflight();
testUnplannedFileBlocksCockpitPatchPreflight();
testBlockedPlanBlocksCockpitPatchPreflight();

console.log('cockpitMountPatchPreflight tests passed');
