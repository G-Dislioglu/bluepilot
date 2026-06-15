import assert from 'node:assert/strict';

import {
  invalidateMemoryCacheByOperatorContract,
  MEMORY_CACHE_OPERATOR_INVALIDATION_CONFIRM,
} from '../src/memoryCacheOperatorInvalidationContract.js';
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

function testReadyOperatorInvalidation(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const result = invalidateMemoryCacheByOperatorContract({
    store,
    cacheRef: 'memory:aicos-cards',
    confirm: MEMORY_CACHE_OPERATOR_INVALIDATION_CONFIRM,
    operatorApprovalRef: 'approval:operator:bpk-052',
    reasonRef: 'reason:refresh-live-aicos-cards',
  });

  assert.equal(result.status, 'invalidated');
  assert.equal(result.invalidationAllowed, true);
  assert.equal(result.durablePersistenceAllowed, false);
  assert.equal(store.read('memory:aicos-cards').status, 'missing');
}

function testMissingApprovalRequiresReview(): void {
  const store = createLiveAicosMemoryCacheStoreShell([entry]);
  const result = invalidateMemoryCacheByOperatorContract({
    store,
    cacheRef: 'memory:aicos-cards',
    confirm: MEMORY_CACHE_OPERATOR_INVALIDATION_CONFIRM,
    reasonRef: 'reason:refresh-live-aicos-cards',
  });

  assert.equal(result.status, 'review_required');
  assert.equal(result.invalidationAllowed, false);
  assert.ok(result.reviewItems.includes('aicos_memory_cache_operator_invalidation.operator_approval_ref_required'));
  assert.equal(store.read('memory:aicos-cards', '2026-06-13T15:03:00.000Z').status, 'fresh');
}

function testMissingEntryBlocksInvalidation(): void {
  const store = createLiveAicosMemoryCacheStoreShell();
  const result = invalidateMemoryCacheByOperatorContract({
    store,
    cacheRef: 'memory:aicos-cards',
    confirm: MEMORY_CACHE_OPERATOR_INVALIDATION_CONFIRM,
    operatorApprovalRef: 'approval:operator:bpk-052',
    reasonRef: 'reason:refresh-live-aicos-cards',
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.blockers.includes('aicos_memory_cache_operator_invalidation.store_missing:aicos_memory_cache_store.entry_missing'));
}

testReadyOperatorInvalidation();
testMissingApprovalRequiresReview();
testMissingEntryBlocksInvalidation();

console.log('memoryCacheOperatorInvalidationContract tests passed');
