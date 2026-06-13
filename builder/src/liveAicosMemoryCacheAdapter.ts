import type { LiveAicosMemoryCacheAdapterPlan } from './liveAicosMemoryCacheAdapterPlan.js';
import type { LiveAicosNetworkConnectorResult } from './liveAicosNetworkConnector.js';

export type LiveAicosMemoryCacheReadStatus = 'fresh' | 'stale' | 'missing' | 'blocked';

export interface LiveAicosMemoryCacheEntry {
  cacheRef: string;
  sourceRef?: string;
  capturedAt?: string;
  storedAt: string;
  expiresAt: string;
  acceptedCards: number;
  payload: LiveAicosNetworkConnectorResult;
}

export interface LiveAicosMemoryCacheWriteResult {
  status: 'stored' | 'blocked';
  entry?: LiveAicosMemoryCacheEntry;
  blockers: string[];
}

export interface LiveAicosMemoryCacheReadResult {
  status: LiveAicosMemoryCacheReadStatus;
  entry?: LiveAicosMemoryCacheEntry;
  blockers: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function writeLiveAicosMemoryCacheEntry(
  plan: LiveAicosMemoryCacheAdapterPlan,
  network: LiveAicosNetworkConnectorResult,
  storedAt = new Date().toISOString(),
): LiveAicosMemoryCacheWriteResult {
  const blockers: string[] = [];
  const cacheRef = normalize(plan.cacheRef);

  if (plan.status !== 'ready' || !plan.memoryCacheAdapterAllowed) {
    blockers.push(...plan.blockers.map((blocker) => `aicos_memory_cache_adapter.plan_blocked:${blocker}`));
    blockers.push('aicos_memory_cache_adapter.plan_not_ready');
  }
  if (plan.durablePersistenceAllowed !== false) {
    blockers.push('aicos_memory_cache_adapter.durable_persistence_must_stay_closed');
  }
  if (!cacheRef) {
    blockers.push('aicos_memory_cache_adapter.cache_ref_required');
  }
  if (!plan.expiresAt) {
    blockers.push('aicos_memory_cache_adapter.expires_at_required');
  }
  if (network.status !== 'accepted') {
    blockers.push(`aicos_memory_cache_adapter.network_not_accepted:${network.status}`);
  }

  if (blockers.length > 0) {
    return { status: 'blocked', blockers: unique(blockers) };
  }

  const expiresAt = plan.expiresAt as string;
  return {
    status: 'stored',
    entry: {
      cacheRef,
      ...(network.sourceRef ? { sourceRef: network.sourceRef } : {}),
      ...(network.capturedAt ? { capturedAt: network.capturedAt } : {}),
      storedAt,
      expiresAt,
      acceptedCards: network.summary.acceptedCards,
      payload: network,
    },
    blockers: [],
  };
}

export function readLiveAicosMemoryCacheEntry(
  entry: LiveAicosMemoryCacheEntry | undefined,
  nowIso = new Date().toISOString(),
): LiveAicosMemoryCacheReadResult {
  if (!entry) {
    return { status: 'missing', blockers: ['aicos_memory_cache_adapter.entry_missing'] };
  }

  const now = new Date(nowIso).getTime();
  const expires = new Date(entry.expiresAt).getTime();
  if (Number.isNaN(now) || Number.isNaN(expires)) {
    return { status: 'blocked', entry, blockers: ['aicos_memory_cache_adapter.invalid_time'] };
  }

  return now <= expires
    ? { status: 'fresh', entry, blockers: [] }
    : { status: 'stale', entry, blockers: ['aicos_memory_cache_adapter.entry_stale'] };
}
