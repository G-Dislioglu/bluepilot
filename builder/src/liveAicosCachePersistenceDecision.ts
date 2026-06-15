import type { LiveAicosFetchCacheContract } from './liveAicosFetchCacheContract.js';
import type { LiveAicosNetworkConnectorResult } from './liveAicosNetworkConnector.js';

export type LiveAicosCachePersistenceMode = 'disabled' | 'memory_only' | 'durable_cache';
export type LiveAicosCachePersistenceStatus = 'ready' | 'review_required' | 'blocked';

export interface LiveAicosCachePersistenceDecisionInput {
  mode: LiveAicosCachePersistenceMode;
  contract: LiveAicosFetchCacheContract;
  network?: LiveAicosNetworkConnectorResult;
  storageRef?: string;
  operatorReviewRef?: string;
}

export interface LiveAicosCachePersistenceDecision {
  status: LiveAicosCachePersistenceStatus;
  mode: LiveAicosCachePersistenceMode;
  cachePersistenceAllowed: boolean;
  durablePersistenceAllowed: false;
  storageRef?: string;
  ttlSeconds?: number;
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

export function decideLiveAicosCachePersistence(
  input: LiveAicosCachePersistenceDecisionInput,
): LiveAicosCachePersistenceDecision {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const storageRef = normalize(input.storageRef);
  const operatorReviewRef = normalize(input.operatorReviewRef);

  if (input.mode === 'disabled') {
    blockers.push('aicos_cache_persistence.mode_disabled');
  }
  if (input.contract.status === 'blocked') {
    blockers.push(...input.contract.blockers.map((blocker) => `aicos_cache_persistence.contract_blocked:${blocker}`));
  }
  if (input.contract.status === 'review_required') {
    reviewItems.push(...input.contract.reviewItems.map((item) => `aicos_cache_persistence.contract_review_required:${item}`));
  }
  if (!input.contract.cacheWriteAllowed) {
    blockers.push('aicos_cache_persistence.cache_write_not_allowed');
  }

  if (!input.network) {
    blockers.push('aicos_cache_persistence.network_result_required');
  } else if (input.network.status === 'blocked') {
    blockers.push(...input.network.reasons.map((reason) => `aicos_cache_persistence.network_blocked:${reason}`));
  } else if (input.network.status === 'review_required') {
    reviewItems.push(...input.network.reasons.map((reason) => `aicos_cache_persistence.network_review_required:${reason}`));
  }

  if (input.mode === 'durable_cache') {
    blockers.push('aicos_cache_persistence.durable_cache_requires_separate_storage_contract');
    if (!storageRef) {
      blockers.push('aicos_cache_persistence.storage_ref_required');
    }
    if (!operatorReviewRef) {
      reviewItems.push('aicos_cache_persistence.operator_review_ref_required');
    }
  }

  const status: LiveAicosCachePersistenceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    mode: input.mode,
    cachePersistenceAllowed: status === 'ready' && input.mode === 'memory_only',
    durablePersistenceAllowed: false,
    ...(storageRef ? { storageRef } : {}),
    ...(input.contract.normalized.cacheTtlSeconds !== undefined ? { ttlSeconds: input.contract.normalized.cacheTtlSeconds } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['allow_memory_only_cache_in_later_adapter', 'keep_durable_cache_closed']
      : status === 'review_required'
        ? ['complete_cache_persistence_review']
        : ['resolve_cache_persistence_blockers'],
  };
}
