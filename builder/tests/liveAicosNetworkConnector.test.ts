import assert from 'node:assert/strict';

import {
  fetchLiveAicosCardsThroughIntake,
  type LiveAicosNetworkFetcher,
} from '../src/liveAicosNetworkConnector.js';
import type { LiveAicosFetchCacheContract } from '../src/liveAicosFetchCacheContract.js';

const readyContract: LiveAicosFetchCacheContract = {
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

const acceptedPayload = {
  sourceRef: 'aicos://cards/operator-safe',
  capturedAt: '2026-06-13T11:00:00.000Z',
  cards: [{
    cardId: 'sol-dev-008',
    title: 'Live card intake',
    status: 'active',
    policy: 'allow',
    appliesToPaths: ['builder/src/liveAicosNetworkConnector.ts'],
    evidenceRef: 'aicos://cards/sol-dev-008',
  }],
};

function okJson(payload: unknown, status = 200): ReturnType<LiveAicosNetworkFetcher> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  });
}

async function testFetchesReadyContractThroughIntake(): Promise<void> {
  let capturedUrl = '';
  let capturedAuth = '';
  const fetcher: LiveAicosNetworkFetcher = async (url, init) => {
    capturedUrl = url;
    capturedAuth = init.headers.Authorization;
    return okJson(acceptedPayload);
  };

  const result = await fetchLiveAicosCardsThroughIntake({
    contract: readyContract,
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher,
    fetchedAt: '2026-06-13T11:01:00.000Z',
  });

  assert.equal(result.status, 'accepted');
  assert.equal(result.summary.acceptedCards, 1);
  assert.equal(result.network.endpointUrl, 'https://aicos.example.test/cards');
  assert.equal(result.network.httpStatus, 200);
  assert.equal(capturedUrl, 'https://aicos.example.test/cards');
  assert.equal(capturedAuth, 'Bearer live-token-value');
  assert.ok(!JSON.stringify(result).includes('live-token-value'));
}

async function testBlockedContractDoesNotFetch(): Promise<void> {
  let calls = 0;
  const result = await fetchLiveAicosCardsThroughIntake({
    contract: {
      ...readyContract,
      status: 'blocked',
      liveFetchAllowed: false,
      blockers: ['aicos_fetch_cache.auth_ref_required'],
    },
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher: async () => {
      calls += 1;
      return okJson(acceptedPayload);
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(calls, 0);
  assert.ok(result.reasons.includes('aicos_network.contract_blocked:aicos_fetch_cache.auth_ref_required'));
  assert.ok(result.reasons.includes('aicos_network.live_fetch_not_allowed'));
}

async function testInvalidEndpointBlocksBeforeFetch(): Promise<void> {
  let calls = 0;
  const result = await fetchLiveAicosCardsThroughIntake({
    contract: readyContract,
    endpointUrl: 'http://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher: async () => {
      calls += 1;
      return okJson(acceptedPayload);
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(calls, 0);
  assert.ok(result.reasons.includes('aicos_network.endpoint_url_must_be_https'));
}

async function testMissingTokenBlocksBeforeFetch(): Promise<void> {
  let calls = 0;
  const result = await fetchLiveAicosCardsThroughIntake({
    contract: readyContract,
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => '',
    fetcher: async () => {
      calls += 1;
      return okJson(acceptedPayload);
    },
  });

  assert.equal(result.status, 'blocked');
  assert.equal(calls, 0);
  assert.ok(result.reasons.includes('aicos_network.auth_token_required'));
}

async function testHttpStatusBlocks(): Promise<void> {
  const result = await fetchLiveAicosCardsThroughIntake({
    contract: readyContract,
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher: async () => okJson({ error: 'nope' }, 503),
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('aicos_network.http_status:503'));
  assert.equal(result.network.httpStatus, 503);
}

async function testMalformedPayloadBlocksThroughIntake(): Promise<void> {
  const result = await fetchLiveAicosCardsThroughIntake({
    contract: readyContract,
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher: async () => okJson({ sourceRef: '', cards: 'bad' }),
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('aicos_connector.source_ref_required'));
  assert.ok(result.reasons.includes('aicos_connector.captured_at_required'));
  assert.ok(result.reasons.includes('aicos_connector.cards_array_required'));
}

async function testSourceRefMismatchBlocks(): Promise<void> {
  const result = await fetchLiveAicosCardsThroughIntake({
    contract: readyContract,
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher: async () => okJson({
      ...acceptedPayload,
      sourceRef: 'aicos://cards/other',
    }),
  });

  assert.equal(result.status, 'blocked');
  assert.ok(result.reasons.includes('aicos_network.source_ref_mismatch'));
}

async function testDoesNotMutateInputs(): Promise<void> {
  const contract = structuredClone(readyContract);
  const before = JSON.stringify(contract);
  await fetchLiveAicosCardsThroughIntake({
    contract,
    endpointUrl: 'https://aicos.example.test/cards',
    authTokenProvider: () => 'live-token-value',
    fetcher: async () => okJson(acceptedPayload),
  });

  assert.equal(JSON.stringify(contract), before);
}

await testFetchesReadyContractThroughIntake();
await testBlockedContractDoesNotFetch();
await testInvalidEndpointBlocksBeforeFetch();
await testMissingTokenBlocksBeforeFetch();
await testHttpStatusBlocks();
await testMalformedPayloadBlocksThroughIntake();
await testSourceRefMismatchBlocks();
await testDoesNotMutateInputs();

console.log('liveAicosNetworkConnector tests passed');
