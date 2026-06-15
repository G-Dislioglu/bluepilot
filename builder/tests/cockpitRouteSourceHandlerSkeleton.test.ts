import assert from 'node:assert/strict';

import { handleCockpitRouteSourceSelection } from '../src/cockpitRouteSourceHandlerSkeleton.js';
import type { CockpitProjectionAdoptionContract } from '../src/cockpitProjectionAdoptionContract.js';
import type { CockpitRouteSourceMountPrep } from '../src/cockpitRouteSourceMountPrep.js';

const prep: CockpitRouteSourceMountPrep = {
  status: 'ready',
  mountPrepAllowed: true,
  routeMutationAllowed: false,
  routePath: '/cockpit/read-only',
  envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  sourceSelectorRef: 'selector:live-or-sample',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const sampleModel: CockpitProjectionAdoptionContract = {
  status: 'ready',
  cockpitModelAllowed: true,
  executableActionAllowed: false,
  audience: 'operator',
  contractTaskId: 'BPK-sample',
  reasons: [],
  headline: 'Sample cockpit',
  panels: [],
  actions: [{ id: 'open_write', enabled: false, reason: 'sample_disabled' }],
};

const liveModel: CockpitProjectionAdoptionContract = {
  ...sampleModel,
  contractTaskId: 'BPK-live',
  headline: 'Live cockpit',
};

function testSelectsLiveModelReadOnly(): void {
  const result = handleCockpitRouteSourceSelection(prep, {
    source: 'live',
    sampleModel,
    liveModel,
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.ok, true);
  assert.equal(result.body.selectedSource, 'live');
  assert.equal(result.body.routeMutationAllowed, false);
  assert.equal(result.body.executableActionAllowed, false);
  assert.equal(result.body.model?.contractTaskId, 'BPK-live');
  assert.equal(result.body.model?.actions[0]?.enabled, false);
}

function testFallsBackToSampleModel(): void {
  const result = handleCockpitRouteSourceSelection(prep, {
    source: 'sample',
    sampleModel,
  });

  assert.equal(result.statusCode, 200);
  assert.equal(result.body.selectedSource, 'sample');
  assert.equal(result.body.model?.contractTaskId, 'BPK-sample');
}

function testBlockedPrepBlocksHandler(): void {
  const result = handleCockpitRouteSourceSelection({
    ...prep,
    status: 'blocked',
    mountPrepAllowed: false,
    blockers: ['cockpit_route_mount_prep.route_source_not_allowed'],
  }, {
    source: 'live',
    sampleModel,
    liveModel,
  });

  assert.equal(result.statusCode, 400);
  assert.equal(result.body.ok, false);
  assert.ok(result.body.reasons.includes('cockpit_route_source_handler.mount_prep_not_allowed'));
}

testSelectsLiveModelReadOnly();
testFallsBackToSampleModel();
testBlockedPrepBlocksHandler();

console.log('cockpitRouteSourceHandlerSkeleton tests passed');
