import type { MemoryCacheAuditExportPermitConsumeExecutionPreflight } from './memoryCacheAuditExportPermitConsumeExecutionPreflight.js';

export type MemoryCacheAuditExportPermitConsumeExecutionAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionAuthorityInput {
  preflight: MemoryCacheAuditExportPermitConsumeExecutionPreflight;
  executionAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionAuthority {
  status: MemoryCacheAuditExportPermitConsumeExecutionAuthorityStatus;
  consumeExecutionAuthorityAllowed: boolean;
  consumeExecutionAuthorized: boolean;
  consumeApplicationAuthorized: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationAuthorityId?: string;
  executionAuthorityId?: string;
  authorizedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  authorizedExecution: {
    kind: 'memory_cache_audit_export_permit_consume_execution_authority';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    applicationAuthorityRef?: string;
    executionPreflightRef?: string;
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

export function authorizeMemoryCacheAuditExportPermitConsumeExecution(
  input: MemoryCacheAuditExportPermitConsumeExecutionAuthorityInput,
): MemoryCacheAuditExportPermitConsumeExecutionAuthority {
  const executionAuthorityId = normalize(input.executionAuthorityId);
  const authorizedByRef = normalize(input.authorizedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.consumeExecutionPreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_authority.preflight_not_allowed');
  }
  if (!input.preflight.consumeApplicationAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_authority.application_must_be_authorized');
  }
  if (!input.preflight.permitConsumeAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_authority.consume_must_be_authorized');
  }
  if (
    input.preflight.permitConsumed !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_authority.write_and_external_gates_must_stay_closed');
  }
  if (!executionAuthorityId) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_authority.execution_authority_id_required');
  }
  if (!authorizedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_authority.authorized_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionAuthorityAllowed: status === 'ready',
    consumeExecutionAuthorized: status === 'ready',
    consumeApplicationAuthorized: input.preflight.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.preflight.permitConsumeAuthorized,
    permitIssued: input.preflight.permitIssued,
    permitConsumed: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.preflight.permitId ? { permitId: input.preflight.permitId } : {}),
    ...(input.preflight.consumeAuthorityId ? { consumeAuthorityId: input.preflight.consumeAuthorityId } : {}),
    ...(input.preflight.applicationAuthorityId ? { applicationAuthorityId: input.preflight.applicationAuthorityId } : {}),
    ...(executionAuthorityId ? { executionAuthorityId } : {}),
    ...(authorizedByRef ? { authorizedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, executionAuthorityId, expiresAtRef]),
    authorizedExecution: {
      kind: 'memory_cache_audit_export_permit_consume_execution_authority',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.permitId ? { permitRef: input.preflight.permitId } : {}),
      ...(input.preflight.applicationAuthorityId ? { applicationAuthorityRef: input.preflight.applicationAuthorityId } : {}),
      ...(input.preflight.executionPreflightRef ? { executionPreflightRef: input.preflight.executionPreflightRef } : {}),
      ...(input.preflight.executionPolicyRef ? { policyRef: input.preflight.executionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_receipt_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_authority_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_authority_blockers'],
  };
}
