import type { LiveAicosMemoryCacheStoreShellInvalidationResult } from './liveAicosMemoryCacheStoreShell.js';
import type { LiveAicosMemoryCacheStoreShell } from './liveAicosMemoryCacheStoreShell.js';

export type MemoryCacheOperatorInvalidationStatus = 'invalidated' | 'review_required' | 'blocked';

export interface MemoryCacheOperatorInvalidationInput {
  store: LiveAicosMemoryCacheStoreShell;
  cacheRef: string;
  confirm?: string;
  operatorApprovalRef?: string;
  reasonRef?: string;
}

export interface MemoryCacheOperatorInvalidationContract {
  status: MemoryCacheOperatorInvalidationStatus;
  invalidationAllowed: boolean;
  durablePersistenceAllowed: false;
  schedulerAllowed: false;
  cacheRef: string;
  operatorApprovalRef?: string;
  reasonRef?: string;
  result?: LiveAicosMemoryCacheStoreShellInvalidationResult;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

export const MEMORY_CACHE_OPERATOR_INVALIDATION_CONFIRM = 'invalidate-live-aicos-memory-cache-entry';

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function invalidateMemoryCacheByOperatorContract(
  input: MemoryCacheOperatorInvalidationInput,
): MemoryCacheOperatorInvalidationContract {
  const cacheRef = normalize(input.cacheRef);
  const confirm = normalize(input.confirm);
  const operatorApprovalRef = normalize(input.operatorApprovalRef);
  const reasonRef = normalize(input.reasonRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (!cacheRef) {
    blockers.push('aicos_memory_cache_operator_invalidation.cache_ref_required');
  }
  if (input.store.durablePersistenceAllowed !== false) {
    blockers.push('aicos_memory_cache_operator_invalidation.durable_persistence_must_stay_closed');
  }
  if (confirm !== MEMORY_CACHE_OPERATOR_INVALIDATION_CONFIRM) {
    blockers.push('aicos_memory_cache_operator_invalidation.confirm_required');
  }
  if (!operatorApprovalRef) {
    reviewItems.push('aicos_memory_cache_operator_invalidation.operator_approval_ref_required');
  }
  if (!reasonRef) {
    reviewItems.push('aicos_memory_cache_operator_invalidation.reason_ref_required');
  }

  if (blockers.length > 0 || reviewItems.length > 0) {
    const status: MemoryCacheOperatorInvalidationStatus = blockers.length > 0 ? 'blocked' : 'review_required';
    return {
      status,
      invalidationAllowed: false,
      durablePersistenceAllowed: false,
      schedulerAllowed: false,
      cacheRef,
      ...(operatorApprovalRef ? { operatorApprovalRef } : {}),
      ...(reasonRef ? { reasonRef } : {}),
      blockers: unique(blockers),
      reviewItems: unique(reviewItems),
      nextActions: status === 'review_required'
        ? ['complete_memory_cache_operator_invalidation_review']
        : ['resolve_memory_cache_operator_invalidation_blockers'],
    };
  }

  const result = input.store.invalidate(cacheRef);
  if (result.status !== 'invalidated') {
    blockers.push(...result.blockers.map((blocker) => `aicos_memory_cache_operator_invalidation.store_${result.status}:${blocker}`));
  }

  const status: MemoryCacheOperatorInvalidationStatus = blockers.length > 0 ? 'blocked' : 'invalidated';
  return {
    status,
    invalidationAllowed: status === 'invalidated',
    durablePersistenceAllowed: false,
    schedulerAllowed: false,
    cacheRef,
    operatorApprovalRef,
    reasonRef,
    result,
    blockers: unique(blockers),
    reviewItems: [],
    nextActions: status === 'invalidated'
      ? ['record_memory_cache_invalidation_evidence']
      : ['resolve_memory_cache_operator_invalidation_blockers'],
  };
}
