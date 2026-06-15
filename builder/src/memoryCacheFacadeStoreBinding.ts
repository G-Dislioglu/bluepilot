import {
  buildLiveAicosMemoryCacheReadFacade,
  type LiveAicosMemoryCacheReadFacade,
} from './liveAicosMemoryCacheReadFacade.js';
import type { LiveAicosMemoryCacheLifecycleGuard } from './liveAicosMemoryCacheLifecycleGuard.js';
import type { LiveAicosMemoryCacheReadResult } from './liveAicosMemoryCacheAdapter.js';
import type { LiveAicosMemoryCacheStoreShell } from './liveAicosMemoryCacheStoreShell.js';

export type MemoryCacheFacadeStoreBindingStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheFacadeStoreBindingInput {
  store: LiveAicosMemoryCacheStoreShell;
  lifecycle: LiveAicosMemoryCacheLifecycleGuard;
  cacheRef: string;
  facadeRef?: string;
  nowIso?: string;
}

export interface MemoryCacheFacadeStoreBinding {
  status: MemoryCacheFacadeStoreBindingStatus;
  bindingAllowed: boolean;
  durablePersistenceAllowed: false;
  cacheRef: string;
  read: LiveAicosMemoryCacheReadResult;
  facade: LiveAicosMemoryCacheReadFacade;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function bindMemoryCacheFacadeToStore(
  input: MemoryCacheFacadeStoreBindingInput,
): MemoryCacheFacadeStoreBinding {
  const cacheRef = normalize(input.cacheRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (!cacheRef) {
    blockers.push('aicos_memory_cache_binding.cache_ref_required');
  }
  if (input.store.durablePersistenceAllowed !== false) {
    blockers.push('aicos_memory_cache_binding.durable_persistence_must_stay_closed');
  }

  const read = input.store.read(cacheRef, input.nowIso);
  const facade = buildLiveAicosMemoryCacheReadFacade({
    lifecycle: input.lifecycle,
    read,
    facadeRef: input.facadeRef,
  });

  if (facade.status === 'blocked') {
    blockers.push(...facade.blockers.map((blocker) => `aicos_memory_cache_binding.facade_blocked:${blocker}`));
  }
  if (facade.status === 'review_required') {
    reviewItems.push(...facade.reviewItems.map((item) => `aicos_memory_cache_binding.facade_review_required:${item}`));
  }
  if (!facade.readAllowed) {
    blockers.push('aicos_memory_cache_binding.facade_read_not_allowed');
  }
  if (facade.durablePersistenceAllowed !== false) {
    blockers.push('aicos_memory_cache_binding.facade_durable_persistence_must_stay_closed');
  }

  const status: MemoryCacheFacadeStoreBindingStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    bindingAllowed: status === 'ready',
    durablePersistenceAllowed: false,
    cacheRef,
    read,
    facade,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['use_bound_memory_cache_facade_in_later_live_cockpit_source_task']
      : status === 'review_required'
        ? ['complete_memory_cache_facade_store_binding_review']
        : ['resolve_memory_cache_facade_store_binding_blockers'],
  };
}
