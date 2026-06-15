import assert from 'node:assert/strict';

import { bindMemoryCacheInvalidationEvidence } from '../src/memoryCacheInvalidationEvidenceBinding.js';
import type { MemoryCacheFacadeStoreBinding } from '../src/memoryCacheFacadeStoreBinding.js';
import type { MemoryCacheOperatorInvalidationContract } from '../src/memoryCacheOperatorInvalidationContract.js';

const priorBinding: MemoryCacheFacadeStoreBinding = {
  status: 'ready',
  bindingAllowed: true,
  durablePersistenceAllowed: false,
  cacheRef: 'memory:aicos-cards',
  read: {
    status: 'fresh',
    entry: {
      cacheRef: 'memory:aicos-cards',
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
  },
  facade: {
    status: 'ready',
    readAllowed: true,
    durablePersistenceAllowed: false,
    facadeRef: 'facade:aicos-memory-cache-read',
    acceptedCards: 2,
    blockers: [],
    reviewItems: [],
    nextActions: [],
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

const invalidation: MemoryCacheOperatorInvalidationContract = {
  status: 'invalidated',
  invalidationAllowed: true,
  durablePersistenceAllowed: false,
  schedulerAllowed: false,
  cacheRef: 'memory:aicos-cards',
  operatorApprovalRef: 'approval:operator:bpk-052',
  reasonRef: 'reason:refresh-live-aicos-cards',
  result: {
    status: 'invalidated',
    cacheRef: 'memory:aicos-cards',
    blockers: [],
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyEvidenceBinding(): void {
  const binding = bindMemoryCacheInvalidationEvidence({
    priorBinding,
    invalidation,
    evidenceRef: 'review-packets/BPK-052.md',
  });

  assert.equal(binding.status, 'ready');
  assert.equal(binding.evidenceBindingAllowed, true);
  assert.equal(binding.durablePersistenceAllowed, false);
}

function testMissingEvidenceRequiresReview(): void {
  const binding = bindMemoryCacheInvalidationEvidence({ priorBinding, invalidation });

  assert.equal(binding.status, 'review_required');
  assert.ok(binding.reviewItems.includes('aicos_cache_invalidation_evidence.evidence_ref_required'));
}

function testBlockedInvalidationBlocksBinding(): void {
  const binding = bindMemoryCacheInvalidationEvidence({
    priorBinding,
    invalidation: {
      ...invalidation,
      status: 'blocked',
      invalidationAllowed: false,
      blockers: ['aicos_memory_cache_operator_invalidation.store_missing:aicos_memory_cache_store.entry_missing'],
    },
    evidenceRef: 'review-packets/BPK-052.md',
  });

  assert.equal(binding.status, 'blocked');
  assert.ok(binding.blockers.includes('aicos_cache_invalidation_evidence.invalidation_not_confirmed'));
}

testReadyEvidenceBinding();
testMissingEvidenceRequiresReview();
testBlockedInvalidationBlocksBinding();

console.log('memoryCacheInvalidationEvidenceBinding tests passed');
