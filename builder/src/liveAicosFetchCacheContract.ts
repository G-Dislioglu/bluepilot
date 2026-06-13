export type LiveAicosFetchMode = 'disabled' | 'dry_run_fetch' | 'cache_enabled_fetch';
export type LiveAicosFetchCacheStatus = 'ready' | 'review_required' | 'blocked';
export type LiveAicosStaleBehavior = 'block_on_stale' | 'review_on_stale';

export interface LiveAicosFetchCacheInput {
  mode: LiveAicosFetchMode;
  endpointRef?: string;
  authRef?: string;
  cacheTtlSeconds?: number;
  staleBehavior?: LiveAicosStaleBehavior;
  quarantineInvalidSnapshots?: boolean;
  maxCardsPerFetch?: number;
}

export interface LiveAicosFetchCacheContract {
  status: LiveAicosFetchCacheStatus;
  liveFetchAllowed: boolean;
  cacheWriteAllowed: boolean;
  blockers: string[];
  reviewItems: string[];
  normalized: {
    mode: LiveAicosFetchMode;
    endpointRef?: string;
    authRef?: string;
    cacheTtlSeconds?: number;
    staleBehavior?: LiveAicosStaleBehavior;
    quarantineInvalidSnapshots: boolean;
    maxCardsPerFetch: number;
  };
  nextActions: string[];
}

const MIN_TTL_SECONDS = 30;
const MAX_TTL_SECONDS = 3600;
const MIN_CARDS_PER_FETCH = 1;
const MAX_CARDS_PER_FETCH = 200;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function looksTokenLike(value: string): boolean {
  return /^(ghp_|github_pat_|sk-|Bearer\s+)/i.test(value) || value.length > 80;
}

export function classifyLiveAicosFetchCache(
  input: LiveAicosFetchCacheInput,
): LiveAicosFetchCacheContract {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const endpointRef = normalize(input.endpointRef);
  const authRef = normalize(input.authRef);
  const quarantineInvalidSnapshots = input.quarantineInvalidSnapshots === true;
  const maxCardsPerFetch = input.maxCardsPerFetch ?? 50;

  if (input.mode === 'disabled') {
    blockers.push('aicos_fetch_cache.mode_disabled');
  }
  if (!endpointRef) {
    blockers.push('aicos_fetch_cache.endpoint_ref_required');
  }
  if (!authRef) {
    blockers.push('aicos_fetch_cache.auth_ref_required');
  } else if (looksTokenLike(authRef)) {
    blockers.push('aicos_fetch_cache.auth_ref_must_not_contain_secret');
  }
  if (!quarantineInvalidSnapshots) {
    blockers.push('aicos_fetch_cache.quarantine_required');
  }
  if (input.mode === 'cache_enabled_fetch') {
    if (input.cacheTtlSeconds === undefined) {
      blockers.push('aicos_fetch_cache.ttl_required');
    } else if (input.cacheTtlSeconds < MIN_TTL_SECONDS || input.cacheTtlSeconds > MAX_TTL_SECONDS) {
      blockers.push(`aicos_fetch_cache.ttl_out_of_bounds:${input.cacheTtlSeconds}`);
    }
    if (!input.staleBehavior) {
      blockers.push('aicos_fetch_cache.stale_behavior_required');
    } else if (input.staleBehavior === 'review_on_stale') {
      reviewItems.push('aicos_fetch_cache.stale_behavior_review_required');
    }
  }
  if (maxCardsPerFetch < MIN_CARDS_PER_FETCH || maxCardsPerFetch > MAX_CARDS_PER_FETCH) {
    blockers.push(`aicos_fetch_cache.max_cards_out_of_bounds:${maxCardsPerFetch}`);
  }

  const status: LiveAicosFetchCacheStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    liveFetchAllowed: status === 'ready' && input.mode !== 'disabled',
    cacheWriteAllowed: status === 'ready' && input.mode === 'cache_enabled_fetch',
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    normalized: {
      mode: input.mode,
      ...(endpointRef ? { endpointRef } : {}),
      ...(authRef ? { authRef } : {}),
      ...(input.cacheTtlSeconds !== undefined ? { cacheTtlSeconds: input.cacheTtlSeconds } : {}),
      ...(input.staleBehavior ? { staleBehavior: input.staleBehavior } : {}),
      quarantineInvalidSnapshots,
      maxCardsPerFetch,
    },
    nextActions: status === 'ready'
      ? ['open_live_fetch_connector_contract', 'pipe_results_through_aicos_card_binding_intake']
      : status === 'review_required'
        ? ['review_stale_cache_behavior_before_connector']
        : ['resolve_fetch_cache_blockers_before_live_connector'],
  };
}
