import type { LiveAicosCachePersistenceDecision } from './liveAicosCachePersistenceDecision.js';
import type { LiveAicosNetworkConnectorResult } from './liveAicosNetworkConnector.js';

export type LiveAicosMemoryCacheAdapterPlanStatus = 'ready' | 'review_required' | 'blocked';

export interface LiveAicosMemoryCacheAdapterPlanInput {
  decision: LiveAicosCachePersistenceDecision;
  network?: LiveAicosNetworkConnectorResult;
  cacheRef?: string;
  nowIso?: string;
}

export interface LiveAicosMemoryCacheAdapterPlan {
  status: LiveAicosMemoryCacheAdapterPlanStatus;
  memoryCacheAdapterAllowed: boolean;
  durablePersistenceAllowed: false;
  cacheRef?: string;
  ttlSeconds?: number;
  expiresAt?: string;
  entryCount: number;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function addSeconds(nowIso: string, seconds: number): string | undefined {
  const date = new Date(nowIso);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return new Date(date.getTime() + seconds * 1000).toISOString();
}

export function planLiveAicosMemoryCacheAdapter(
  input: LiveAicosMemoryCacheAdapterPlanInput,
): LiveAicosMemoryCacheAdapterPlan {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const cacheRef = normalize(input.cacheRef);
  const nowIso = input.nowIso ?? new Date().toISOString();
  const ttlSeconds = input.decision.ttlSeconds;

  if (input.decision.status === 'blocked') {
    blockers.push(...input.decision.blockers.map((blocker) => `aicos_memory_cache.decision_blocked:${blocker}`));
  }
  if (input.decision.status === 'review_required') {
    reviewItems.push(...input.decision.reviewItems.map((item) => `aicos_memory_cache.decision_review_required:${item}`));
  }
  if (!input.decision.cachePersistenceAllowed) {
    blockers.push('aicos_memory_cache.persistence_not_allowed');
  }
  if (input.decision.mode !== 'memory_only') {
    blockers.push(`aicos_memory_cache.mode_not_memory_only:${input.decision.mode}`);
  }
  if (!input.network) {
    blockers.push('aicos_memory_cache.network_result_required');
  } else if (input.network.status !== 'accepted') {
    blockers.push(`aicos_memory_cache.network_not_accepted:${input.network.status}`);
  }
  if (!cacheRef) {
    reviewItems.push('aicos_memory_cache.cache_ref_required');
  }
  if (ttlSeconds === undefined || ttlSeconds < 1) {
    blockers.push('aicos_memory_cache.ttl_required');
  }

  const expiresAt = ttlSeconds ? addSeconds(nowIso, ttlSeconds) : undefined;
  if (ttlSeconds && !expiresAt) {
    blockers.push('aicos_memory_cache.now_iso_invalid');
  }

  const status: LiveAicosMemoryCacheAdapterPlanStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    memoryCacheAdapterAllowed: status === 'ready',
    durablePersistenceAllowed: false,
    ...(cacheRef ? { cacheRef } : {}),
    ...(ttlSeconds !== undefined ? { ttlSeconds } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    entryCount: input.network?.summary.acceptedCards ?? 0,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['build_memory_only_cache_adapter_in_later_contract', 'keep_durable_cache_closed']
      : status === 'review_required'
        ? ['complete_memory_cache_review_items']
        : ['resolve_memory_cache_blockers'],
  };
}
