import assert from 'node:assert/strict';

import { bindMemoryCacheFacadeToStore } from '../src/memoryCacheFacadeStoreBinding.js';
import { createLiveAicosMemoryCacheStoreShell } from '../src/liveAicosMemoryCacheStoreShell.js';
import type { LiveAicosMemoryCacheEntry } from '../src/liveAicosMemoryCacheAdapter.js';
import type { LiveAicosMemoryCacheLifecycleGuard } from '../src/liveAicosMemoryCacheLifecycleGuard.js';

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

function testReadyBinding(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const binding = bindMemoryCacheFacadeToStore({
    store,
    lifecycle,
    cacheRef: 'memory:aicos-cards',
    facadeRef: 'facade:aicos-memory-cache-read',
    nowIso: '2026-06-13T15:03:00.000Z',
  });

  assert.equal(binding.status, 'ready');
  assert.equal(binding.bindingAllowed, true);
  assert.equal(binding.durablePersistenceAllowed, false);
  assert.equal(binding.facade.readAllowed, true);
}

function testStaleEntryBlocksBinding(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const binding = bindMemoryCacheFacadeToStore({
    store,
    lifecycle,
    cacheRef: 'memory:aicos-cards',
    facadeRef: 'facade:aicos-memory-cache-read',
    nowIso: '2026-06-13T15:06:00.000Z',
  });

  assert.equal(binding.status, 'blocked');
  assert.ok(binding.blockers.includes('aicos_memory_cache_binding.facade_read_not_allowed'));
}

function testMissingCacheRefBlocksBinding(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const binding = bindMemoryCacheFacadeToStore({
    store,
    lifecycle,
    cacheRef: '',
    facadeRef: 'facade:aicos-memory-cache-read',
    nowIso: '2026-06-13T15:03:00.000Z',
  });

  assert.equal(binding.status, 'blocked');
  assert.ok(binding.blockers.includes('aicos_memory_cache_binding.cache_ref_required'));
}

testReadyBinding();
testStaleEntryBlocksBinding();
testMissingCacheRefBlocksBinding();

console.log('memoryCacheFacadeStoreBinding tests passed');
