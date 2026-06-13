import assert from 'node:assert/strict';

import {
  readLiveAicosMemoryCacheEntry,
  writeLiveAicosMemoryCacheEntry,
} from '../src/liveAicosMemoryCacheAdapter.js';
import type { LiveAicosMemoryCacheAdapterPlan } from '../src/liveAicosMemoryCacheAdapterPlan.js';
import type { LiveAicosNetworkConnectorResult } from '../src/liveAicosNetworkConnector.js';

const plan: LiveAicosMemoryCacheAdapterPlan = {
  status: 'ready',
  memoryCacheAdapterAllowed: true,
  durablePersistenceAllowed: false,
  cacheRef: 'memory:aicos-cards',
  ttlSeconds: 300,
  expiresAt: '2026-06-13T14:05:00.000Z',
  entryCount: 1,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const network: LiveAicosNetworkConnectorResult = {
  status: 'accepted',
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T14:00:00.000Z',
  reasons: [],
  summary: { acceptedCards: 1, quarantinedCards: 0 },
  network: {
    endpointRef: 'aicos://cards/operator-safe',
    endpointUrl: 'https://aicos.example.test/cards',
    fetchedAt: '2026-06-13T14:00:01.000Z',
    httpStatus: 200,
  },
};

function testWritesAndReadsFreshEntry(): void {
  const write = writeLiveAicosMemoryCacheEntry(plan, network, '2026-06-13T14:00:02.000Z');

  assert.equal(write.status, 'stored');
  assert.equal(write.entry?.cacheRef, 'memory:aicos-cards');
  assert.equal(write.entry?.acceptedCards, 1);

  const read = readLiveAicosMemoryCacheEntry(write.entry, '2026-06-13T14:04:59.000Z');
  assert.equal(read.status, 'fresh');
}

function testReadsStaleEntry(): void {
  const write = writeLiveAicosMemoryCacheEntry(plan, network, '2026-06-13T14:00:02.000Z');
  const read = readLiveAicosMemoryCacheEntry(write.entry, '2026-06-13T14:05:01.000Z');

  assert.equal(read.status, 'stale');
  assert.ok(read.blockers.includes('aicos_memory_cache_adapter.entry_stale'));
}

function testBlockedPlanDoesNotStore(): void {
  const write = writeLiveAicosMemoryCacheEntry({
    ...plan,
    status: 'blocked',
    memoryCacheAdapterAllowed: false,
    blockers: ['aicos_memory_cache.persistence_not_allowed'],
  }, network);

  assert.equal(write.status, 'blocked');
  assert.ok(write.blockers.includes('aicos_memory_cache_adapter.plan_not_ready'));
}

testWritesAndReadsFreshEntry();
testReadsStaleEntry();
testBlockedPlanDoesNotStore();

console.log('liveAicosMemoryCacheAdapter tests passed');
