import type { MemoryCacheAuditExportPermitConsumeApplicationAuthority } from './memoryCacheAuditExportPermitConsumeApplicationAuthority.js';

export type MemoryCacheAuditExportPermitConsumeExecutionPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeExecutionPreflightInput {
  authority: MemoryCacheAuditExportPermitConsumeApplicationAuthority;
  executionPreflightRef?: string;
  executorRef?: string;
  executionPolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeExecutionPreflight {
  status: MemoryCacheAuditExportPermitConsumeExecutionPreflightStatus;
  consumeExecutionPreflightAllowed: boolean;
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
  executionPreflightRef?: string;
  executorRef?: string;
  executionPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  consumeExecution: {
    kind: 'memory_cache_audit_export_permit_consume_execution_preflight';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    applicationAuthorityRef?: string;
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

export function preflightMemoryCacheAuditExportPermitConsumeExecution(
  input: MemoryCacheAuditExportPermitConsumeExecutionPreflightInput,
): MemoryCacheAuditExportPermitConsumeExecutionPreflight {
  const executionPreflightRef = normalize(input.executionPreflightRef);
  const executorRef = normalize(input.executorRef);
  const executionPolicyRef = normalize(input.executionPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_execution_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_execution_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.consumeApplicationAuthorityAllowed || !input.authority.consumeApplicationAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_preflight.application_authority_not_allowed');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_preflight.consume_must_be_authorized');
  }
  if (!input.authority.permitIssued) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_preflight.permit_must_be_issued');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_execution_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!executionPreflightRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_preflight.execution_preflight_ref_required');
  }
  if (!executorRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_preflight.executor_ref_required');
  }
  if (!executionPolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_execution_preflight.execution_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeExecutionPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeExecutionPreflightAllowed: status === 'ready',
    consumeApplicationAuthorized: input.authority.consumeApplicationAuthorized,
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(input.authority.applicationAuthorityId ? { applicationAuthorityId: input.authority.applicationAuthorityId } : {}),
    ...(executionPreflightRef ? { executionPreflightRef } : {}),
    ...(executorRef ? { executorRef } : {}),
    ...(executionPolicyRef ? { executionPolicyRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, executionPreflightRef, executionPolicyRef]),
    consumeExecution: {
      kind: 'memory_cache_audit_export_permit_consume_execution_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.applicationAuthorityId ? { applicationAuthorityRef: input.authority.applicationAuthorityId } : {}),
      ...(executionPolicyRef ? { policyRef: executionPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_execution_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_execution_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_execution_preflight_blockers'],
  };
}
