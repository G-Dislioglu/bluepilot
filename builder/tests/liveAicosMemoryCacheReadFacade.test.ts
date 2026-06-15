import assert from 'node:assert/strict';

import { buildLiveAicosMemoryCacheReadFacade } from '../src/liveAicosMemoryCacheReadFacade.js';
import type { LiveAicosMemoryCacheLifecycleGuard } from '../src/liveAicosMemoryCacheLifecycleGuard.js';
import type { LiveAicosMemoryCacheReadResult } from '../src/liveAicosMemoryCacheAdapter.js';

const read: LiveAicosMemoryCacheReadResult = {
  status: 'fresh',
  entry: {
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
  },
  blockers: [],
};

const lifecycle: LiveAicosMemoryCacheLifecycleGuard = {
  status: 'ready',
  cacheUseAllowed: true,
  invalidationAllowed: true,
  stalePolicy: 'block',
  ageSeconds: 60,
  maxAgeSeconds: 300,
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyReadFacade(): void {
  const facade = buildLiveAicosMemoryCacheReadFacade({
    lifecycle,
    read,
    facadeRef: 'facade:aicos-memory-cache-read',
  });

  assert.equal(facade.status, 'ready');
  assert.equal(facade.readAllowed, true);
  assert.equal(facade.durablePersistenceAllowed, false);
  assert.equal(facade.acceptedCards, 2);
}

function testMissingFacadeRefRequiresReview(): void {
  const facade = buildLiveAicosMemoryCacheReadFacade({ lifecycle, read });

  assert.equal(facade.status, 'review_required');
  assert.ok(facade.reviewItems.includes('aicos_cache_read_facade.facade_ref_required'));
}

function testStaleReadBlocks(): void {
  const facade = buildLiveAicosMemoryCacheReadFacade({
    lifecycle: { ...lifecycle, cacheUseAllowed: false, status: 'blocked', blockers: ['aicos_cache_lifecycle.stale_blocked'] },
    read: { ...read, status: 'stale', blockers: ['aicos_memory_cache_adapter.entry_stale'] },
    facadeRef: 'facade:aicos-memory-cache-read',
  });

  assert.equal(facade.status, 'blocked');
  assert.ok(facade.blockers.includes('aicos_cache_read_facade.read_not_fresh:stale'));
}

testReadyReadFacade();
testMissingFacadeRefRequiresReview();
testStaleReadBlocks();

console.log('liveAicosMemoryCacheReadFacade tests passed');
