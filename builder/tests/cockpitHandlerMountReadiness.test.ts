import assert from 'node:assert/strict';

import { assessCockpitHandlerMountReadiness } from '../src/cockpitHandlerMountReadiness.js';
import type { CockpitRouteSourceHandlerResult } from '../src/cockpitRouteSourceHandlerSkeleton.js';

const handlerResult: CockpitRouteSourceHandlerResult = {
  statusCode: 200,
  body: {
    ok: true,
    code: 'cockpit_route_source_handler_ready',
    selectedSource: 'live',
    routePath: '/cockpit/read-only',
    routeMutationAllowed: false,
    executableActionAllowed: false,
    sourceSelectorRef: 'selector:live-or-sample',
    model: {
      status: 'ready',
      cockpitModelAllowed: true,
      executableActionAllowed: false,
      audience: 'operator',
      contractTaskId: 'BPK-live',
      reasons: [],
      headline: 'Live cockpit',
      panels: [],
      actions: [{ id: 'open_write', enabled: false, reason: 'disabled' }],
    },
    reasons: ['cockpit_route_source_handler.skeleton_only_no_route_mount'],
  },
};

function testReadyMountReadiness(): void {
  const readiness = assessCockpitHandlerMountReadiness({
    handlerResult,
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    routeModuleRef: 'builder/src/cockpitReadOnlyRoute.ts',
  });

  assert.equal(readiness.status, 'ready');
  assert.equal(readiness.mountReadinessAllowed, true);
  assert.equal(readiness.serverMutationAllowed, false);
  assert.equal(readiness.executableActionAllowed, false);
}

function testMissingRouteModuleRequiresReview(): void {
  const readiness = assessCockpitHandlerMountReadiness({
    handlerResult,
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  });

  assert.equal(readiness.status, 'review_required');
  assert.ok(readiness.reviewItems.includes('cockpit_handler_mount.route_module_ref_required'));
}

function testExecutableModelActionBlocksReadiness(): void {
  const readiness = assessCockpitHandlerMountReadiness({
    handlerResult: {
      ...handlerResult,
      body: {
        ...handlerResult.body,
        model: {
          ...handlerResult.body.model!,
          actions: [{ id: 'open_write', enabled: true as false, reason: 'bad_fixture' }],
        },
      },
    },
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    routeModuleRef: 'builder/src/cockpitReadOnlyRoute.ts',
  });

  assert.equal(readiness.status, 'blocked');
  assert.ok(readiness.blockers.includes('cockpit_handler_mount.model_actions_must_stay_disabled'));
}

testReadyMountReadiness();
testMissingRouteModuleRequiresReview();
testExecutableModelActionBlocksReadiness();

console.log('cockpitHandlerMountReadiness tests passed');
