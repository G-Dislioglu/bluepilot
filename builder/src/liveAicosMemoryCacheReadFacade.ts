import type { LiveAicosMemoryCacheLifecycleGuard } from './liveAicosMemoryCacheLifecycleGuard.js';
import type { LiveAicosMemoryCacheReadResult } from './liveAicosMemoryCacheAdapter.js';

export type LiveAicosMemoryCacheReadFacadeStatus = 'ready' | 'review_required' | 'blocked';

export interface LiveAicosMemoryCacheReadFacadeInput {
  lifecycle: LiveAicosMemoryCacheLifecycleGuard;
  read: LiveAicosMemoryCacheReadResult;
  facadeRef?: string;
}

export interface LiveAicosMemoryCacheReadFacade {
  status: LiveAicosMemoryCacheReadFacadeStatus;
  readAllowed: boolean;
  durablePersistenceAllowed: false;
  facadeRef?: string;
  acceptedCards: number;
  sourceRef?: string;
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

export function buildLiveAicosMemoryCacheReadFacade(
  input: LiveAicosMemoryCacheReadFacadeInput,
): LiveAicosMemoryCacheReadFacade {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const facadeRef = normalize(input.facadeRef);

  if (input.lifecycle.status === 'blocked') {
    blockers.push(...input.lifecycle.blockers.map((blocker) => `aicos_cache_read_facade.lifecycle_blocked:${blocker}`));
  }
  if (input.lifecycle.status === 'review_required') {
    reviewItems.push(...input.lifecycle.reviewItems.map((item) => `aicos_cache_read_facade.lifecycle_review_required:${item}`));
  }
  if (!input.lifecycle.cacheUseAllowed) {
    blockers.push('aicos_cache_read_facade.cache_use_not_allowed');
  }
  if (input.read.status !== 'fresh') {
    blockers.push(`aicos_cache_read_facade.read_not_fresh:${input.read.status}`);
  }
  if (!input.read.entry) {
    blockers.push('aicos_cache_read_facade.entry_required');
  }
  if (!facadeRef) {
    reviewItems.push('aicos_cache_read_facade.facade_ref_required');
  }

  const status: LiveAicosMemoryCacheReadFacadeStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    readAllowed: status === 'ready',
    durablePersistenceAllowed: false,
    ...(facadeRef ? { facadeRef } : {}),
    acceptedCards: input.read.entry?.acceptedCards ?? 0,
    ...(input.read.entry?.sourceRef ? { sourceRef: input.read.entry.sourceRef } : {}),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['use_cache_read_facade_in_later_live_model_source']
      : status === 'review_required'
        ? ['complete_cache_read_facade_review']
        : ['resolve_cache_read_facade_blockers'],
  };
}
