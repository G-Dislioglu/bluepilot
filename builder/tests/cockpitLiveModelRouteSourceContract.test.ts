import assert from 'node:assert/strict';

import { contractCockpitLiveModelRouteSource } from '../src/cockpitLiveModelRouteSourceContract.js';
import type { CockpitLiveModelAdapterResult } from '../src/cockpitLiveModelAdapter.js';

const adapter: CockpitLiveModelAdapterResult = {
  status: 'ready',
  model: {
    status: 'ready',
    cockpitModelAllowed: true,
    executableActionAllowed: false,
    audience: 'operator',
    contractTaskId: 'BPK-cockpit-live',
    reasons: [],
    headline: 'Ready',
    panels: [],
    actions: [],
  },
  routeWiringAllowed: false,
  executableActionAllowed: false,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRouteSourceContract(): void {
  const contract = contractCockpitLiveModelRouteSource({
    adapter,
    routePath: '/cockpit/read-only',
    sourceMode: 'materialized_live_model',
    operatorReviewRef: 'operator:BPK-035',
  });

  assert.equal(contract.status, 'ready');
  assert.equal(contract.routeSourceAllowed, true);
  assert.equal(contract.routeMutationAllowed, false);
  assert.equal(contract.executableActionAllowed, false);
}

function testMissingOperatorReviewRequiresReview(): void {
  const contract = contractCockpitLiveModelRouteSource({
    adapter,
    routePath: '/cockpit/read-only',
    sourceMode: 'materialized_live_model',
  });

  assert.equal(contract.status, 'review_required');
  assert.ok(contract.reviewItems.includes('cockpit_route_source.operator_review_ref_required'));
}

function testUnsupportedRouteBlocks(): void {
  const contract = contractCockpitLiveModelRouteSource({
    adapter,
    routePath: '/cockpit/live',
    sourceMode: 'materialized_live_model',
    operatorReviewRef: 'operator:BPK-035',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('cockpit_route_source.unsupported_route:/cockpit/live'));
}

testReadyRouteSourceContract();
testMissingOperatorReviewRequiresReview();
testUnsupportedRouteBlocks();

console.log('cockpitLiveModelRouteSourceContract tests passed');
