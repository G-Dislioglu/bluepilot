import type { MemoryCacheInvalidationEvidenceBinding } from './memoryCacheInvalidationEvidenceBinding.js';

export type MemoryCacheInvalidationAuditTrailStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheInvalidationAuditTrailInput {
  binding: MemoryCacheInvalidationEvidenceBinding;
  auditRef?: string;
  auditorRef?: string;
}

export interface MemoryCacheInvalidationAuditTrail {
  status: MemoryCacheInvalidationAuditTrailStatus;
  auditTrailAllowed: boolean;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  auditRef?: string;
  auditorRef?: string;
  cacheRef: string;
  events: Array<{
    id: string;
    detail: string;
  }>;
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

export function buildMemoryCacheInvalidationAuditTrail(
  input: MemoryCacheInvalidationAuditTrailInput,
): MemoryCacheInvalidationAuditTrail {
  const auditRef = normalize(input.auditRef);
  const auditorRef = normalize(input.auditorRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.binding.status === 'blocked') {
    blockers.push(...input.binding.blockers.map((blocker) => `aicos_cache_invalidation_audit.binding_blocked:${blocker}`));
  }
  if (input.binding.status === 'review_required') {
    reviewItems.push(...input.binding.reviewItems.map((item) => `aicos_cache_invalidation_audit.binding_review_required:${item}`));
  }
  if (!input.binding.evidenceBindingAllowed) {
    blockers.push('aicos_cache_invalidation_audit.binding_not_allowed');
  }
  if (input.binding.durablePersistenceAllowed !== false) {
    blockers.push('aicos_cache_invalidation_audit.durable_persistence_must_stay_closed');
  }
  if (!auditRef) {
    reviewItems.push('aicos_cache_invalidation_audit.audit_ref_required');
  }
  if (!auditorRef) {
    reviewItems.push('aicos_cache_invalidation_audit.auditor_ref_required');
  }

  const status: MemoryCacheInvalidationAuditTrailStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    auditTrailAllowed: status === 'ready',
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(auditRef ? { auditRef } : {}),
    ...(auditorRef ? { auditorRef } : {}),
    cacheRef: input.binding.cacheRef,
    events: [
      { id: 'prior_read_status', detail: input.binding.priorReadStatus },
      { id: 'invalidation_status', detail: input.binding.invalidationStatus },
      { id: 'evidence_ref', detail: input.binding.evidenceRef ?? 'missing' },
      { id: 'persistence_scope', detail: 'memory_only_no_durable_store' },
    ],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_memory_cache_invalidation_audit_to_operator_review']
      : status === 'review_required'
        ? ['complete_memory_cache_invalidation_audit_review']
        : ['resolve_memory_cache_invalidation_audit_blockers'],
  };
}
