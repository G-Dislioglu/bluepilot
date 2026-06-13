import assert from 'node:assert/strict';

import { planLiveAicosMemoryCacheAdapter } from '../src/liveAicosMemoryCacheAdapterPlan.js';
import type { LiveAicosCachePersistenceDecision } from '../src/liveAicosCachePersistenceDecision.js';
import type { LiveAicosNetworkConnectorResult } from '../src/liveAicosNetworkConnector.js';

const decision: LiveAicosCachePersistenceDecision = {
  status: 'ready',
  mode: 'memory_only',
  cachePersistenceAllowed: true,
  durablePersistenceAllowed: false,
  ttlSeconds: 300,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const network: LiveAicosNetworkConnectorResult = {
  status: 'accepted',
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T13:00:00.000Z',
  reasons: [],
  summary: { acceptedCards: 2, quarantinedCards: 0 },
  network: {
    endpointRef: 'aicos://cards/operator-safe',
    endpointUrl: 'https://aicos.example.test/cards',
    fetchedAt: '2026-06-13T13:01:00.000Z',
    httpStatus: 200,
  },
};

function testReadyMemoryCachePlanComputesExpiry(): void {
  const plan = planLiveAicosMemoryCacheAdapter({
    decision,
    network,
    cacheRef: 'memory:aicos-cards',
    nowIso: '2026-06-13T13:00:00.000Z',
  });

  assert.equal(plan.status, 'ready');
  assert.equal(plan.memoryCacheAdapterAllowed, true);
  assert.equal(plan.durablePersistenceAllowed, false);
  assert.equal(plan.entryCount, 2);
  assert.equal(plan.expiresAt, '2026-06-13T13:05:00.000Z');
}

function testMissingCacheRefRequiresReview(): void {
  const plan = planLiveAicosMemoryCacheAdapter({
    decision,
    network,
    nowIso: '2026-06-13T13:00:00.000Z',
  });

  assert.equal(plan.status, 'review_required');
  assert.equal(plan.memoryCacheAdapterAllowed, false);
  assert.ok(plan.reviewItems.includes('aicos_memory_cache.cache_ref_required'));
}

function testDurableDecisionBlocksMemoryPlan(): void {
  const plan = planLiveAicosMemoryCacheAdapter({
    decision: {
      ...decision,
      status: 'blocked',
      mode: 'durable_cache',
      cachePersistenceAllowed: false,
      blockers: ['aicos_cache_persistence.durable_cache_requires_separate_storage_contract'],
    },
    network,
    cacheRef: 'memory:aicos-cards',
  });

  assert.equal(plan.status, 'blocked');
  assert.ok(plan.blockers.includes('aicos_memory_cache.mode_not_memory_only:durable_cache'));
}

testReadyMemoryCachePlanComputesExpiry();
testMissingCacheRefRequiresReview();
testDurableDecisionBlocksMemoryPlan();

console.log('liveAicosMemoryCacheAdapterPlan tests passed');
