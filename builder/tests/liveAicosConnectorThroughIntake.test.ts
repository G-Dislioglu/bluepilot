import assert from 'node:assert/strict';

import { routeLiveAicosPayloadThroughIntake, type LiveAicosConnectorPayload } from '../src/liveAicosConnectorThroughIntake.js';
import type { LiveAicosFetchCacheContract } from '../src/liveAicosFetchCacheContract.js';

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

const payload: LiveAicosConnectorPayload = {
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T10:00:00.000Z',
  cards: [{
    cardId: 'sol-dev-006',
    title: 'Builder WLP discipline',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/example.ts'],
    evidenceRef: 'aicos://cards/sol-dev-006',
  }],
};

function testAcceptedPayload(): void {
  const result = routeLiveAicosPayloadThroughIntake(contract, payload);

  assert.equal(result.status, 'accepted');
  assert.equal(result.summary.acceptedCards, 1);
  assert.equal(result.summary.quarantinedCards, 0);
  assert.equal(result.intake?.acceptedCards[0].cardId, 'sol-dev-006');
}

function testBlockedContractBlocksPayload(): void {
  const result = routeLiveAicosPayloadThroughIntake({
    ...contract,
    status: 'blocked',
    liveFetchAllowed: false,
    blockers: ['aicos_fetch_cache.auth_ref_required'],
  }, payload);

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('aicos_connector.contract_blocked:aicos_fetch_cache.auth_ref_required'));
  assert.ok(result.reasons.includes('aicos_connector.live_fetch_not_allowed'));
}

function testReviewContractRequiresReview(): void {
  const result = routeLiveAicosPayloadThroughIntake({
    ...contract,
    status: 'review_required',
    liveFetchAllowed: false,
    reviewItems: ['aicos_fetch_cache.stale_behavior_review_required'],
  }, payload);

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('aicos_connector.contract_review_required:aicos_fetch_cache.stale_behavior_review_required'));
  assert.ok(result.reasons.includes('aicos_connector.live_fetch_not_allowed'));
}

function testMalformedPayloadBlocks(): void {
  const result = routeLiveAicosPayloadThroughIntake(contract, { sourceRef: '', capturedAt: '' });

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('aicos_connector.source_ref_required'));
  assert.ok(result.reasons.includes('aicos_connector.captured_at_required'));
  assert.ok(result.reasons.includes('aicos_connector.cards_array_required'));
}

function testIntakeQuarantineRequiresReview(): void {
  const result = routeLiveAicosPayloadThroughIntake(contract, {
    ...payload,
    cards: [{ ...payload.cards[0], evidenceRef: '' }],
  });

  assert.equal(result.status, 'review_required');
  assert.equal(result.summary.acceptedCards, 0);
  assert.equal(result.summary.quarantinedCards, 1);
  assert.ok(result.reasons.includes('aicos_connector.intake_quarantine_present'));
}

function testDoesNotMutateInputs(): void {
  const before = JSON.stringify({ contract, payload });
  routeLiveAicosPayloadThroughIntake(contract, payload);
  assert.equal(JSON.stringify({ contract, payload }), before);
}

testAcceptedPayload();
testBlockedContractBlocksPayload();
testReviewContractRequiresReview();
testMalformedPayloadBlocks();
testIntakeQuarantineRequiresReview();
testDoesNotMutateInputs();

console.log('liveAicosConnectorThroughIntake tests passed');
