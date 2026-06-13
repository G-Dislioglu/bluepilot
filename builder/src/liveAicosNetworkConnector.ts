import {
  routeLiveAicosPayloadThroughIntake,
  type LiveAicosConnectorPayload,
  type LiveAicosConnectorThroughIntakeResult,
} from './liveAicosConnectorThroughIntake.js';
import type { LiveAicosFetchCacheContract } from './liveAicosFetchCacheContract.js';

export interface LiveAicosNetworkFetchInit {
  method: 'GET';
  headers: Record<string, string>;
  signal?: AbortSignal;
}

export interface LiveAicosNetworkFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

export type LiveAicosNetworkFetcher = (
  url: string,
  init: LiveAicosNetworkFetchInit,
) => Promise<LiveAicosNetworkFetchResponse>;

export interface LiveAicosNetworkConnectorInput {
  contract: LiveAicosFetchCacheContract;
  endpointUrl?: string;
  authTokenProvider?: () => string | undefined;
  authHeaderName?: string;
  fetcher?: LiveAicosNetworkFetcher;
  signal?: AbortSignal;
  fetchedAt?: string;
}

export interface LiveAicosNetworkConnectorResult extends LiveAicosConnectorThroughIntakeResult {
  network: {
    endpointRef?: string;
    endpointUrl?: string;
    fetchedAt?: string;
    httpStatus?: number;
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function blocked(
  reasons: string[],
  contract: LiveAicosFetchCacheContract,
  partial: Partial<LiveAicosNetworkConnectorResult['network']> = {},
): LiveAicosNetworkConnectorResult {
  return {
    status: 'blocked',
    sourceRef: contract.normalized.endpointRef,
    reasons: unique(reasons),
    summary: { acceptedCards: 0, quarantinedCards: 0 },
    network: {
      endpointRef: contract.normalized.endpointRef,
      ...partial,
    },
  };
}

function parseEndpointUrl(endpointUrl: string | undefined): { url?: URL; reason?: string } {
  const normalized = normalize(endpointUrl);
  if (!normalized) {
    return { reason: 'aicos_network.endpoint_url_required' };
  }

  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:') {
      return { reason: 'aicos_network.endpoint_url_must_be_https' };
    }
    if (url.username || url.password) {
      return { reason: 'aicos_network.endpoint_url_must_not_embed_credentials' };
    }
    return { url };
  } catch {
    return { reason: 'aicos_network.endpoint_url_invalid' };
  }
}

async function defaultLiveAicosNetworkFetcher(
  url: string,
  init: LiveAicosNetworkFetchInit,
): Promise<LiveAicosNetworkFetchResponse> {
  const response = await fetch(url, {
    method: init.method,
    headers: init.headers,
    signal: init.signal,
  });

  return {
    ok: response.ok,
    status: response.status,
    json: () => response.json(),
  };
}

function reasonsForClosedContract(contract: LiveAicosFetchCacheContract): string[] {
  const reasons: string[] = [];
  if (contract.status === 'blocked') {
    reasons.push(...contract.blockers.map((blocker) => `aicos_network.contract_blocked:${blocker}`));
  }
  if (contract.status === 'review_required') {
    reasons.push(...contract.reviewItems.map((item) => `aicos_network.contract_review_required:${item}`));
  }
  if (!contract.liveFetchAllowed) {
    reasons.push('aicos_network.live_fetch_not_allowed');
  }
  return reasons;
}

function payloadSourceRef(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const sourceRef = (payload as Partial<LiveAicosConnectorPayload>).sourceRef;
  return typeof sourceRef === 'string' ? sourceRef.trim() : undefined;
}

export async function fetchLiveAicosCardsThroughIntake(
  input: LiveAicosNetworkConnectorInput,
): Promise<LiveAicosNetworkConnectorResult> {
  const contract = input.contract;
  const endpointRef = contract.normalized.endpointRef;
  const closedContractReasons = reasonsForClosedContract(contract);
  if (closedContractReasons.length > 0) {
    return blocked(closedContractReasons, contract);
  }

  const parsed = parseEndpointUrl(input.endpointUrl);
  if (!parsed.url) {
    return blocked([parsed.reason ?? 'aicos_network.endpoint_url_invalid'], contract);
  }

  const authToken = normalize(input.authTokenProvider?.());
  if (!authToken) {
    return blocked(['aicos_network.auth_token_required'], contract, {
      endpointUrl: parsed.url.href,
    });
  }

  const fetcher = input.fetcher ?? defaultLiveAicosNetworkFetcher;
  const headerName = normalize(input.authHeaderName) ?? 'Authorization';
  const fetchedAt = input.fetchedAt ?? new Date().toISOString();
  let response: LiveAicosNetworkFetchResponse;

  try {
    response = await fetcher(parsed.url.href, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        [headerName]: headerName.toLowerCase() === 'authorization' ? `Bearer ${authToken}` : authToken,
      },
      signal: input.signal,
    });
  } catch {
    return blocked(['aicos_network.fetch_failed'], contract, {
      endpointUrl: parsed.url.href,
      fetchedAt,
    });
  }

  if (!response.ok) {
    return blocked([`aicos_network.http_status:${response.status}`], contract, {
      endpointUrl: parsed.url.href,
      fetchedAt,
      httpStatus: response.status,
    });
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return blocked(['aicos_network.invalid_json'], contract, {
      endpointUrl: parsed.url.href,
      fetchedAt,
      httpStatus: response.status,
    });
  }

  const sourceRef = payloadSourceRef(payload);
  if (endpointRef && sourceRef && sourceRef !== endpointRef) {
    return blocked(['aicos_network.source_ref_mismatch'], contract, {
      endpointUrl: parsed.url.href,
      fetchedAt,
      httpStatus: response.status,
    });
  }

  const routed = routeLiveAicosPayloadThroughIntake(
    contract,
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? payload as Partial<LiveAicosConnectorPayload>
      : {},
  );

  return {
    ...routed,
    network: {
      endpointRef,
      endpointUrl: parsed.url.href,
      fetchedAt,
      httpStatus: response.status,
    },
  };
}
