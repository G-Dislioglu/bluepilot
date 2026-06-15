import assert from 'node:assert/strict';

import { decideLiveAicosCachePersistence } from '../src/liveAicosCachePersistenceDecision.js';
import type { LiveAicosFetchCacheContract } from '../src/liveAicosFetchCacheContract.js';
import type { LiveAicosNetworkConnectorResult } from '../src/liveAicosNetworkConnector.js';

const contract: LiveAicosFetchCacheContract = {
  status: 'ready',
  liveFetchAllowed: true,
  cacheWriteAllowed: true,
  blockers: [],
  reviewItems: [],
  normalized: {
    mode: 'cache_enabled_fetch',
    endpointRef: 'aicos://cards/operator-safe',
    authRef: 'secret-ref:AICOS_CARD_READ_TOKEN',
    cacheTtlSeconds: 300,
    staleBehavior: 'block_on_stale',
    quarantineInvalidSnapshots: true,
    maxCardsPerFetch: 50,
  },
  nextActions: [],
};

const network: LiveAicosNetworkConnectorResult = {
  status: 'accepted',
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T12:00:00.000Z',
  reasons: [],
  summary: { acceptedCards: 1, quarantinedCards: 0 },
  network: {
    endpointRef: 'aicos://cards/operator-safe',
    endpointUrl: 'https://aicos.example.test/cards',
    fetchedAt: '2026-06-13T12:01:00.000Z',
    httpStatus: 200,
  },
};

function testMemoryOnlyPersistenceDecisionReady(): void {
  const decision = decideLiveAicosCachePersistence({
    mode: 'memory_only',
    contract,
    network,
  });

  assert.equal(decision.status, 'ready');
  assert.equal(decision.cachePersistenceAllowed, true);
  assert.equal(decision.durablePersistenceAllowed, false);
  assert.equal(decision.ttlSeconds, 300);
}

function testDurableCacheRequiresSeparateContract(): void {
  const decision = decideLiveAicosCachePersistence({
    mode: 'durable_cache',
    contract,
    network,
    storageRef: 'bluepilot://cache/aicos/cards',
    operatorReviewRef: 'review:BPK-025',
  });

  assert.equal(decision.status, 'blocked');
  assert.equal(decision.cachePersistenceAllowed, false);
  assert.equal(decision.durablePersistenceAllowed, false);
  assert.ok(decision.blockers.includes('aicos_cache_persistence.durable_cache_requires_separate_storage_contract'));
}

function testNetworkReviewRequiresReview(): void {
  const decision = decideLiveAicosCachePersistence({
    mode: 'memory_only',
    contract,
    network: {
      ...network,
      status: 'review_required',
      reasons: ['aicos_connector.intake_quarantine_present'],
      summary: { acceptedCards: 0, quarantinedCards: 1 },
    },
  });

  assert.equal(decision.status, 'review_required');
  assert.equal(decision.cachePersistenceAllowed, false);
  assert.ok(decision.reviewItems.includes('aicos_cache_persistence.network_review_required:aicos_connector.intake_quarantine_present'));
}

function testCacheWriteNotAllowedBlocks(): void {
  const decision = decideLiveAicosCachePersistence({
    mode: 'memory_only',
    contract: {
      ...contract,
      cacheWriteAllowed: false,
    },
    network,
  });

  assert.equal(decision.status, 'blocked');
  assert.ok(decision.blockers.includes('aicos_cache_persistence.cache_write_not_allowed'));
}

testMemoryOnlyPersistenceDecisionReady();
testDurableCacheRequiresSeparateContract();
testNetworkReviewRequiresReview();
testCacheWriteNotAllowedBlocks();

console.log('liveAicosCachePersistenceDecision tests passed');
