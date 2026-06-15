import assert from 'node:assert/strict';

import { createLiveAicosMemoryCacheStoreShell } from '../src/liveAicosMemoryCacheStoreShell.js';
import type { LiveAicosMemoryCacheEntry } from '../src/liveAicosMemoryCacheAdapter.js';

const entry: LiveAicosMemoryCacheEntry = {
  cacheRef: 'memory:aicos-cards',
  sourceRef: 'aicos://cards/operator-safe',
  storedAt: '2026-06-13T15:00:00.000Z',
  expiresAt: '2026-06-13T15:05:00.000Z',
  acceptedCards: 2,
  payload: {
    status: 'accepted',
    reasons: [],
    summary: { acceptedCards: 2, quarantinedCards: 0 },
    network: {},
  },
};

function testStoreAndReadFreshEntry(): void {
  const store = createLiveAicosMemoryCacheStoreShell();
  const write = store.put(entry);
  const read = store.read('memory:aicos-cards', '2026-06-13T15:03:00.000Z');

  assert.equal(store.durablePersistenceAllowed, false);
  assert.equal(write.status, 'stored');
  assert.equal(read.status, 'fresh');
  assert.equal(read.entry?.acceptedCards, 2);
}

function testStaleReadUsesExistingSemantics(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const read = store.read('memory:aicos-cards', '2026-06-13T15:06:00.000Z');

  assert.equal(read.status, 'stale');
  assert.ok(read.blockers.includes('aicos_memory_cache_adapter.entry_stale'));
}

function testInvalidationRemovesEntry(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const invalidation = store.invalidate('memory:aicos-cards');
  const read = store.read('memory:aicos-cards', '2026-06-13T15:03:00.000Z');

  assert.equal(invalidation.status, 'invalidated');
  assert.equal(read.status, 'missing');
}

testStoreAndReadFreshEntry();
testStaleReadUsesExistingSemantics();
testInvalidationRemovesEntry();

console.log('liveAicosMemoryCacheStoreShell tests passed');
