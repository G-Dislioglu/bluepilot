import type { MemoryCacheAuditExportPermitConsumePreflight } from './memoryCacheAuditExportPermitConsumePreflight.js';

export type MemoryCacheAuditExportPermitConsumeAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumePreflight;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeAuthority {
  status: MemoryCacheAuditExportPermitConsumeAuthorityStatus;
  permitConsumeAuthorityAllowed: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedConsume: {
    kind: 'memory_cache_audit_export_permit_consume_authority';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    preflightRef?: string;
    policyRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsume(
  input: MemoryCacheAuditExportPermitConsumeAuthorityInput,
): MemoryCacheAuditExportPermitConsumeAuthority {
  const consumeAuthorityId = normalize(input.consumeAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.permitConsumePreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_authority.preflight_not_allowed');
  }
  if (!input.preflight.permitIssued) {
    blockers.push('memory_cache_audit_export_permit_consume_authority.permit_must_be_issued');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_authority.write_and_external_gates_must_stay_closed');
  }
  if (!consumeAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_authority.consume_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitConsumeAuthorityAllowed: status === 'ready',
    permitConsumeAuthorized: status === 'ready',
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(consumeAuthorityId ? { consumeAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, consumeAuthorityId, expiresAtRef]),
    authorizedConsume: {
      kind: 'memory_cache_audit_export_permit_consume_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.consumeRef ? { preflightRef: input.preflight.consumeRef } : {}),
      ...(input.preflight.consumePolicyRef ? { policyRef: input.preflight.consumePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_application_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_authority_blockers'],
  };
}
