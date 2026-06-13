import type { LiveAicosMemoryCacheEntry, LiveAicosMemoryCacheReadResult } from './liveAicosMemoryCacheAdapter.js';

export type LiveAicosCacheStalePolicy = 'block' | 'review';
export type LiveAicosMemoryCacheLifecycleStatus = 'ready' | 'review_required' | 'blocked';

export interface LiveAicosMemoryCacheLifecycleInput {
  read: LiveAicosMemoryCacheReadResult;
  stalePolicy: LiveAicosCacheStalePolicy;
  maxAgeSeconds: number;
  invalidationRef?: string;
  nowIso?: string;
}

export interface LiveAicosMemoryCacheLifecycleGuard {
  status: LiveAicosMemoryCacheLifecycleStatus;
  cacheUseAllowed: boolean;
  invalidationAllowed: boolean;
  stalePolicy: LiveAicosCacheStalePolicy;
  ageSeconds?: number;
  maxAgeSeconds: number;
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function ageSeconds(entry: LiveAicosMemoryCacheEntry, nowIso: string): number | undefined {
  const now = new Date(nowIso).getTime();
  const stored = new Date(entry.storedAt).getTime();
  if (Number.isNaN(now) || Number.isNaN(stored)) {
    return undefined;
  }
  return Math.floor((now - stored) / 1000);
}

export function guardLiveAicosMemoryCacheLifecycle(
  input: LiveAicosMemoryCacheLifecycleInput,
): LiveAicosMemoryCacheLifecycleGuard {
  const blockers: string[] = [];
  const reviewItems: string[] = [];
  const nowIso = input.nowIso ?? new Date().toISOString();
  const invalidationRef = normalize(input.invalidationRef);
  const entryAge = input.read.entry ? ageSeconds(input.read.entry, nowIso) : undefined;

  if (input.maxAgeSeconds < 1 || input.maxAgeSeconds > 3600) {
    blockers.push(`aicos_cache_lifecycle.max_age_out_of_bounds:${input.maxAgeSeconds}`);
  }
  if (input.read.status === 'missing') {
    blockers.push('aicos_cache_lifecycle.entry_missing');
  }
  if (input.read.status === 'blocked') {
    blockers.push(...input.read.blockers.map((blocker) => `aicos_cache_lifecycle.read_blocked:${blocker}`));
  }
  if (entryAge === undefined && input.read.entry) {
    blockers.push('aicos_cache_lifecycle.age_unavailable');
  }
  if (entryAge !== undefined && entryAge > input.maxAgeSeconds) {
    blockers.push(`aicos_cache_lifecycle.max_age_exceeded:${entryAge}`);
  }
  if (input.read.status === 'stale') {
    if (input.stalePolicy === 'block') {
      blockers.push('aicos_cache_lifecycle.stale_blocked');
    } else {
      reviewItems.push('aicos_cache_lifecycle.stale_requires_review');
    }
  }
  if (invalidationRef && !/^operator:|^cache:|^aicos:/.test(invalidationRef)) {
    blockers.push(`aicos_cache_lifecycle.invalid_invalidation_ref:${invalidationRef}`);
  }

  const status: LiveAicosMemoryCacheLifecycleStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    cacheUseAllowed: status === 'ready' && input.read.status === 'fresh',
    invalidationAllowed: Boolean(invalidationRef) && blockers.length === 0,
    stalePolicy: input.stalePolicy,
    ...(entryAge !== undefined ? { ageSeconds: entryAge } : {}),
    maxAgeSeconds: input.maxAgeSeconds,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['use_memory_cache_entry_in_later_read_only_adapter']
      : status === 'review_required'
        ? ['review_stale_memory_cache_entry']
        : ['refresh_or_replace_memory_cache_entry'],
  };
}
