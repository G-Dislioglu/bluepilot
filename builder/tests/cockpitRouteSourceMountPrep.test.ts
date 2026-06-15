import assert from 'node:assert/strict';

import { prepareCockpitRouteSourceMount } from '../src/cockpitRouteSourceMountPrep.js';
import type { CockpitLiveModelRouteSourceContract } from '../src/cockpitLiveModelRouteSourceContract.js';

const contract: CockpitLiveModelRouteSourceContract = {
  status: 'ready',
  routeSourceAllowed: true,
  routeMutationAllowed: false,
  executableActionAllowed: false,
  routePath: '/cockpit/read-only',
  sourceMode: 'materialized_live_model',
  modelTaskId: 'BPK-cockpit-live',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyMountPrep(): void {
  const prep = prepareCockpitRouteSourceMount({
    contract,
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    sourceSelectorRef: 'selector:live-model-or-sample',
  });

  assert.equal(prep.status, 'ready');
  assert.equal(prep.mountPrepAllowed, true);
  assert.equal(prep.routeMutationAllowed, false);
}

function testMissingSelectorRequiresReview(): void {
  const prep = prepareCockpitRouteSourceMount({
    contract,
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
  });

  assert.equal(prep.status, 'review_required');
  assert.ok(prep.reviewItems.includes('cockpit_route_mount_prep.source_selector_ref_required'));
}

function testBlockedContractBlocksPrep(): void {
  const prep = prepareCockpitRouteSourceMount({
    contract: {
      ...contract,
      status: 'blocked',
      routeSourceAllowed: false,
      blockers: ['cockpit_route_source.materialized_model_required'],
    },
    envGateName: 'BLUEPILOT_COCKPIT_LIVE_SOURCE_ENABLED',
    sourceSelectorRef: 'selector:live-model-or-sample',
  });

  assert.equal(prep.status, 'blocked');
  assert.ok(prep.blockers.includes('cockpit_route_mount_prep.route_source_not_allowed'));
}

testReadyMountPrep();
testMissingSelectorRequiresReview();
testBlockedContractBlocksPrep();

console.log('cockpitRouteSourceMountPrep tests passed');
