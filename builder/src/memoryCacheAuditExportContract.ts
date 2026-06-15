import type { MemoryCacheInvalidationAuditTrail } from './memoryCacheInvalidationAuditTrail.js';

export type MemoryCacheAuditExportContractStatus = 'ready' | 'review_required' | 'blocked';
export type MemoryCacheAuditExportFormat = 'json' | 'markdown';

export interface MemoryCacheAuditExportContractInput {
  auditTrail: MemoryCacheInvalidationAuditTrail;
  exportRef?: string;
  format?: MemoryCacheAuditExportFormat;
  consumerRef?: string;
}

export interface MemoryCacheAuditExportContract {
  status: MemoryCacheAuditExportContractStatus;
  exportContractAllowed: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  exportRef?: string;
  consumerRef?: string;
  format: MemoryCacheAuditExportFormat;
  cacheRef: string;
  eventCount: number;
  manifest: {
    auditRef?: string;
    eventIds: string[];
  };
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

function isSupportedFormat(value: string): value is MemoryCacheAuditExportFormat {
  return value === 'json' || value === 'markdown';
}

export function buildMemoryCacheAuditExportContract(
  input: MemoryCacheAuditExportContractInput,
): MemoryCacheAuditExportContract {
  const exportRef = normalize(input.exportRef);
  const consumerRef = normalize(input.consumerRef);
  const requestedFormat = normalize(input.format);
  const format = isSupportedFormat(requestedFormat) ? requestedFormat : 'json';
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.auditTrail.status === 'blocked') {
    blockers.push(...input.auditTrail.blockers.map((blocker) => `memory_cache_audit_export.audit_blocked:${blocker}`));
  }
  if (input.auditTrail.status === 'review_required') {
    reviewItems.push(...input.auditTrail.reviewItems.map((item) => `memory_cache_audit_export.audit_review_required:${item}`));
  }
  if (!input.auditTrail.auditTrailAllowed) {
    blockers.push('memory_cache_audit_export.audit_trail_not_allowed');
  }
  if (input.auditTrail.durablePersistenceAllowed !== false) {
    blockers.push('memory_cache_audit_export.durable_persistence_must_stay_closed');
  }
  if (input.auditTrail.externalActionAllowed !== false) {
    blockers.push('memory_cache_audit_export.external_actions_must_stay_closed');
  }
  if (requestedFormat && !isSupportedFormat(requestedFormat)) {
    blockers.push(`memory_cache_audit_export.unsupported_format:${requestedFormat}`);
  }
  if (!exportRef) {
    reviewItems.push('memory_cache_audit_export.export_ref_required');
  }
  if (!consumerRef) {
    reviewItems.push('memory_cache_audit_export.consumer_ref_required');
  }

  const status: MemoryCacheAuditExportContractStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    exportContractAllowed: status === 'ready',
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(exportRef ? { exportRef } : {}),
    ...(consumerRef ? { consumerRef } : {}),
    format,
    cacheRef: input.auditTrail.cacheRef,
    eventCount: input.auditTrail.events.length,
    manifest: {
      ...(input.auditTrail.auditRef ? { auditRef: input.auditTrail.auditRef } : {}),
      eventIds: input.auditTrail.events.map((event) => event.id),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_evidence_pack']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_review']
        : ['resolve_memory_cache_audit_export_blockers'],
  };
}
