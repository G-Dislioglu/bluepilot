import assert from 'node:assert/strict';

import {
  classifyLiveAicosFetchCache,
  type LiveAicosFetchCacheInput,
} from '../src/liveAicosFetchCacheContract.js';

const readyInput: LiveAicosFetchCacheInput = {
  mode: 'cache_enabled_fetch',
  endpointRef: 'aicos://cards/operator-safe',
  authRef: 'secret-ref:AICOS_CARD_READ_TOKEN',
  cacheTtlSeconds: 300,
  staleBehavior: 'block_on_stale',
  quarantineInvalidSnapshots: true,
  maxCardsPerFetch: 50,
};

function testReadyCacheEnabledFetch(): void {
  const contract = classifyLiveAicosFetchCache(readyInput);

  assert.equal(contract.status, 'ready');
  assert.equal(contract.liveFetchAllowed, true);
  assert.equal(contract.cacheWriteAllowed, true);
  assert.deepEqual(contract.blockers, []);
  assert.equal(contract.normalized.endpointRef, 'aicos://cards/operator-safe');
}

function testDisabledBlocks(): void {
  const contract = classifyLiveAicosFetchCache({ ...readyInput, mode: 'disabled' });

  assert.equal(contract.status, 'blocked');
  assert.equal(contract.liveFetchAllowed, false);
  assert.ok(contract.blockers.includes('aicos_fetch_cache.mode_disabled'));
}

function testMissingAuthBlocks(): void {
  const contract = classifyLiveAicosFetchCache({ ...readyInput, authRef: '   ' });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('aicos_fetch_cache.auth_ref_required'));
}

function testTokenLikeAuthBlocks(): void {
  const contract = classifyLiveAicosFetchCache({ ...readyInput, authRef: 'ghp_realTokenMustNotBeHere' });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('aicos_fetch_cache.auth_ref_must_not_contain_secret'));
}

function testTtlBoundsBlock(): void {
  const contract = classifyLiveAicosFetchCache({ ...readyInput, cacheTtlSeconds: 5 });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('aicos_fetch_cache.ttl_out_of_bounds:5'));
}

function testMissingQuarantineBlocks(): void {
  const contract = classifyLiveAicosFetchCache({ ...readyInput, quarantineInvalidSnapshots: false });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('aicos_fetch_cache.quarantine_required'));
}

function testReviewOnStaleRequiresReview(): void {
  const contract = classifyLiveAicosFetchCache({ ...readyInput, staleBehavior: 'review_on_stale' });

  assert.equal(contract.status, 'review_required');
  assert.equal(contract.liveFetchAllowed, false);
  assert.ok(contract.reviewItems.includes('aicos_fetch_cache.stale_behavior_review_required'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify(readyInput);
  classifyLiveAicosFetchCache(readyInput);
  assert.equal(JSON.stringify(readyInput), before);
}

testReadyCacheEnabledFetch();
testDisabledBlocks();
testMissingAuthBlocks();
testTokenLikeAuthBlocks();
testTtlBoundsBlock();
testMissingQuarantineBlocks();
testReviewOnStaleRequiresReview();
testDoesNotMutateInputs();

console.log('liveAicosFetchCacheContract tests passed');
