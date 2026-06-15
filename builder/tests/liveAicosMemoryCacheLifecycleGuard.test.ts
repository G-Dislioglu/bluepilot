import assert from 'node:assert/strict';

import { guardLiveAicosMemoryCacheLifecycle } from '../src/liveAicosMemoryCacheLifecycleGuard.js';
import type { LiveAicosMemoryCacheReadResult } from '../src/liveAicosMemoryCacheAdapter.js';

const freshRead: LiveAicosMemoryCacheReadResult = {
  status: 'fresh',
  entry: {
    cacheRef: 'memory:aicos-cards',
    storedAt: '2026-06-13T14:00:00.000Z',
    expiresAt: '2026-06-13T14:05:00.000Z',
    acceptedCards: 1,
    payload: {
      status: 'accepted',
      reasons: [],
      summary: { acceptedCards: 1, quarantinedCards: 0 },
      network: {},
    },
  },
  blockers: [],
};

function testFreshCacheAllowed(): void {
  const guard = guardLiveAicosMemoryCacheLifecycle({
    read: freshRead,
    stalePolicy: 'block',
    maxAgeSeconds: 600,
    invalidationRef: 'operator:BPK-036',
    nowIso: '2026-06-13T14:02:00.000Z',
  });

  assert.equal(guard.status, 'ready');
  assert.equal(guard.cacheUseAllowed, true);
  assert.equal(guard.invalidationAllowed, true);
  assert.equal(guard.ageSeconds, 120);
}

function testStaleReviewPolicyRequiresReview(): void {
  const guard = guardLiveAicosMemoryCacheLifecycle({
    read: { ...freshRead, status: 'stale', blockers: ['aicos_memory_cache_adapter.entry_stale'] },
    stalePolicy: 'review',
    maxAgeSeconds: 600,
    nowIso: '2026-06-13T14:06:00.000Z',
  });

  assert.equal(guard.status, 'review_required');
  assert.ok(guard.reviewItems.includes('aicos_cache_lifecycle.stale_requires_review'));
}

function testMaxAgeExceededBlocks(): void {
  const guard = guardLiveAicosMemoryCacheLifecycle({
    read: freshRead,
    stalePolicy: 'block',
    maxAgeSeconds: 60,
    nowIso: '2026-06-13T14:02:00.000Z',
  });

  assert.equal(guard.status, 'blocked');
  assert.ok(guard.blockers.includes('aicos_cache_lifecycle.max_age_exceeded:120'));
}

testFreshCacheAllowed();
testStaleReviewPolicyRequiresReview();
testMaxAgeExceededBlocks();

console.log('liveAicosMemoryCacheLifecycleGuard tests passed');
