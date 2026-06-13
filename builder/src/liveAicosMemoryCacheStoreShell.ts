import {
  readLiveAicosMemoryCacheEntry,
  type LiveAicosMemoryCacheEntry,
  type LiveAicosMemoryCacheReadResult,
} from './liveAicosMemoryCacheAdapter.js';

export interface LiveAicosMemoryCacheStoreShell {
  durablePersistenceAllowed: false;
  put(entry: LiveAicosMemoryCacheEntry): LiveAicosMemoryCacheStoreShellWriteResult;
  read(cacheRef: string, nowIso?: string): LiveAicosMemoryCacheReadResult;
  invalidate(cacheRef: string): LiveAicosMemoryCacheStoreShellInvalidationResult;
  snapshot(): LiveAicosMemoryCacheEntry[];
}

export interface LiveAicosMemoryCacheStoreShellWriteResult {
  status: 'stored' | 'blocked';
  cacheRef?: string;
  blockers: string[];
}

export interface LiveAicosMemoryCacheStoreShellInvalidationResult {
  status: 'invalidated' | 'missing' | 'blocked';
  cacheRef?: string;
  blockers: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function cloneEntry(entry: LiveAicosMemoryCacheEntry): LiveAicosMemoryCacheEntry {
  return {
    ...entry,
    payload: {
      ...entry.payload,
      network: { ...entry.payload.network },
      summary: { ...entry.payload.summary },
      reasons: [...entry.payload.reasons],
    },
  };
}

export function createLiveAicosMemoryCacheStoreShell(
  initialEntries: LiveAicosMemoryCacheEntry[] = [],
): LiveAicosMemoryCacheStoreShell {
  const entries = new Map<string, LiveAicosMemoryCacheEntry>();

  const shell: LiveAicosMemoryCacheStoreShell = {
    durablePersistenceAllowed: false,
    put(entry) {
      const cacheRef = normalize(entry.cacheRef);
      if (!cacheRef) {
        return { status: 'blocked', blockers: ['aicos_memory_cache_store.cache_ref_required'] };
      }
      entries.set(cacheRef, cloneEntry({ ...entry, cacheRef }));
      return { status: 'stored', cacheRef, blockers: [] };
    },
    read(cacheRef, nowIso) {
      const normalizedRef = normalize(cacheRef);
      if (!normalizedRef) {
        return { status: 'blocked', blockers: ['aicos_memory_cache_store.cache_ref_required'] };
      }
      const entry = entries.get(normalizedRef);
      return readLiveAicosMemoryCacheEntry(entry ? cloneEntry(entry) : undefined, nowIso);
    },
    invalidate(cacheRef) {
      const normalizedRef = normalize(cacheRef);
      if (!normalizedRef) {
        return { status: 'blocked', blockers: ['aicos_memory_cache_store.cache_ref_required'] };
      }
      if (!entries.has(normalizedRef)) {
        return { status: 'missing', cacheRef: normalizedRef, blockers: ['aicos_memory_cache_store.entry_missing'] };
      }
      entries.delete(normalizedRef);
      return { status: 'invalidated', cacheRef: normalizedRef, blockers: [] };
    },
    snapshot() {
      return [...entries.values()].map(cloneEntry);
    },
  };

  for (const entry of initialEntries) {
    shell.put(entry);
  }

  return shell;
}
