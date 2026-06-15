import assert from 'node:assert/strict';

import { decideCockpitLiveModelSource } from '../src/cockpitLiveModelSourceDecision.js';
import type { CockpitProjectionAdoptionContract } from '../src/cockpitProjectionAdoptionContract.js';
import type { LiveAicosNetworkConnectorResult } from '../src/liveAicosNetworkConnector.js';

const cockpit: CockpitProjectionAdoptionContract = {
  status: 'ready',
  cockpitModelAllowed: true,
  executableActionAllowed: false,
  audience: 'operator',
  contractTaskId: 'BPK-sample',
  reasons: [],
  headline: 'Ready for operator inspection',
  panels: [],
  actions: [{
    id: 'open_runtime_dispatch',
    enabled: false,
    reason: 'disabled',
  }],
};

const network: LiveAicosNetworkConnectorResult = {
  status: 'accepted',
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T12:00:00.000Z',
  reasons: [],
  summary: {
    acceptedCards: 1,
    quarantinedCards: 0,
  },
  network: {
    endpointRef: 'aicos://cards/operator-safe',
    endpointUrl: 'https://aicos.example.test/cards',
    fetchedAt: '2026-06-13T12:01:00.000Z',
    httpStatus: 200,
  },
};

function testLiveAicosSourceReadyAfterOperatorReview(): void {
  const decision = decideCockpitLiveModelSource({
    mode: 'live_aicos_read_only',
    cockpit,
    network,
    operatorReviewRef: 'review:BPK-024',
  });

  assert.equal(decision.status, 'ready');
  assert.equal(decision.liveModelSourceAllowed, true);
  assert.equal(decision.executableActionAllowed, false);
  assert.equal(decision.acceptedCards, 1);
}

function testLiveAicosSourceNeedsOperatorReview(): void {
  const decision = decideCockpitLiveModelSource({
    mode: 'live_aicos_read_only',
    cockpit,
    network,
  });

  assert.equal(decision.status, 'review_required');
  assert.equal(decision.liveModelSourceAllowed, false);
  assert.ok(decision.reviewItems.includes('cockpit_live_source.operator_review_ref_required'));
}

function testNetworkBlockerBlocksLiveSource(): void {
  const decision = decideCockpitLiveModelSource({
    mode: 'live_aicos_read_only',
    cockpit,
    network: {
      ...network,
      status: 'blocked',
      reasons: ['aicos_network.http_status:503'],
      summary: { acceptedCards: 0, quarantinedCards: 0 },
    },
    operatorReviewRef: 'review:BPK-024',
  });

  assert.equal(decision.status, 'blocked');
  assert.ok(decision.blockers.includes('cockpit_live_source.network_blocked:aicos_network.http_status:503'));
}

function testSampleOnlyKeepsLiveSourceClosed(): void {
  const decision = decideCockpitLiveModelSource({
    mode: 'sample_only',
    cockpit,
  });

  assert.equal(decision.status, 'ready');
  assert.equal(decision.liveModelSourceAllowed, false);
}

testLiveAicosSourceReadyAfterOperatorReview();
testLiveAicosSourceNeedsOperatorReview();
testNetworkBlockerBlocksLiveSource();
testSampleOnlyKeepsLiveSourceClosed();

console.log('cockpitLiveModelSourceDecision tests passed');
