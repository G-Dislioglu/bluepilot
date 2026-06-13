import type { MemoryCacheFacadeStoreBinding } from './memoryCacheFacadeStoreBinding.js';
import type { MemoryCacheOperatorInvalidationContract } from './memoryCacheOperatorInvalidationContract.js';

export type MemoryCacheInvalidationEvidenceBindingStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheInvalidationEvidenceBindingInput {
  priorBinding: MemoryCacheFacadeStoreBinding;
  invalidation: MemoryCacheOperatorInvalidationContract;
  evidenceRef?: string;
}

export interface MemoryCacheInvalidationEvidenceBinding {
  status: MemoryCacheInvalidationEvidenceBindingStatus;
  evidenceBindingAllowed: boolean;
  durablePersistenceAllowed: false;
  cacheRef: string;
  evidenceRef?: string;
  invalidationStatus: MemoryCacheOperatorInvalidationContract['status'];
  priorReadStatus: MemoryCacheFacadeStoreBinding['read']['status'];
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

export function bindMemoryCacheInvalidationEvidence(
  input: MemoryCacheInvalidationEvidenceBindingInput,
): MemoryCacheInvalidationEvidenceBinding {
  const evidenceRef = normalize(input.evidenceRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.priorBinding.status === 'blocked') {
    blockers.push(...input.priorBinding.blockers.map((blocker) => `aicos_cache_invalidation_evidence.prior_binding_blocked:${blocker}`));
  }
  if (input.priorBinding.status === 'review_required') {
    reviewItems.push(...input.priorBinding.reviewItems.map((item) => `aicos_cache_invalidation_evidence.prior_binding_review_required:${item}`));
  }
  if (!input.priorBinding.bindingAllowed) {
    blockers.push('aicos_cache_invalidation_evidence.prior_binding_not_allowed');
  }
  if (input.invalidation.status !== 'invalidated' || !input.invalidation.invalidationAllowed) {
    blockers.push(...input.invalidation.blockers.map((blocker) => `aicos_cache_invalidation_evidence.invalidation_blocked:${blocker}`));
    blockers.push('aicos_cache_invalidation_evidence.invalidation_not_confirmed');
  }
  if (input.invalidation.durablePersistenceAllowed !== false || input.invalidation.schedulerAllowed !== false) {
    blockers.push('aicos_cache_invalidation_evidence.invalidation_must_stay_memory_only');
  }
  if (input.priorBinding.cacheRef !== input.invalidation.cacheRef) {
    blockers.push(`aicos_cache_invalidation_evidence.cache_ref_mismatch:${input.priorBinding.cacheRef}->${input.invalidation.cacheRef}`);
  }
  if (!evidenceRef) {
    reviewItems.push('aicos_cache_invalidation_evidence.evidence_ref_required');
  }

  const status: MemoryCacheInvalidationEvidenceBindingStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidenceBindingAllowed: status === 'ready',
    durablePersistenceAllowed: false,
    cacheRef: input.invalidation.cacheRef,
    ...(evidenceRef ? { evidenceRef } : {}),
    invalidationStatus: input.invalidation.status,
    priorReadStatus: input.priorBinding.read.status,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_invalidation_evidence_to_cache_review']
      : status === 'review_required'
        ? ['complete_memory_cache_invalidation_evidence_review']
        : ['resolve_memory_cache_invalidation_evidence_blockers'],
  };
}
