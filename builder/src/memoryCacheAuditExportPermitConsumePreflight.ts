import type { MemoryCacheAuditExportPermitIssueAuthority } from './memoryCacheAuditExportPermitIssueAuthority.js';

export type MemoryCacheAuditExportPermitConsumePreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumePreflightInput {
  authority: MemoryCacheAuditExportPermitIssueAuthority;
  consumeRef?: string;
  consumerRef?: string;
  consumePolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumePreflight {
  status: MemoryCacheAuditExportPermitConsumePreflightStatus;
  permitConsumePreflightAllowed: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitId?: string;
  consumeRef?: string;
  consumerRef?: string;
  consumePolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  permitConsume: {
    kind: 'memory_cache_audit_export_permit_consume_preflight';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    authorityRef?: string;
  };
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function preflightMemoryCacheAuditExportPermitConsume(
  input: MemoryCacheAuditExportPermitConsumePreflightInput,
): MemoryCacheAuditExportPermitConsumePreflight {
  const consumeRef = normalize(input.consumeRef);
  const consumerRef = normalize(input.consumerRef);
  const consumePolicyRef = normalize(input.consumePolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.permitIssueAuthorityAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_preflight.authority_not_allowed');
  }
  if (!input.authority.permitIssued) {
    blockers.push('memory_cache_audit_export_permit_consume_preflight.permit_must_be_issued');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!consumeRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_preflight.consume_ref_required');
  }
  if (!consumerRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_preflight.consumer_ref_required');
  }
  if (!consumePolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_preflight.consume_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumePreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitConsumePreflightAllowed: status === 'ready',
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(consumeRef ? { consumeRef } : {}),
    ...(consumerRef ? { consumerRef } : {}),
    ...(consumePolicyRef ? { consumePolicyRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, consumeRef, consumePolicyRef]),
    permitConsume: {
      kind: 'memory_cache_audit_export_permit_consume_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.issuedByRef ? { authorityRef: input.authority.issuedByRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_preflight_blockers'],
  };
}
