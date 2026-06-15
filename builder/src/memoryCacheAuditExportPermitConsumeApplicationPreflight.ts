import type { MemoryCacheAuditExportPermitConsumeAuthority } from './memoryCacheAuditExportPermitConsumeAuthority.js';

export type MemoryCacheAuditExportPermitConsumeApplicationPreflightStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitConsumeApplicationPreflightInput {
  authority: MemoryCacheAuditExportPermitConsumeAuthority;
  applicationRef?: string;
  operatorRef?: string;
  applicationPolicyRef?: string;
}

export interface MemoryCacheAuditExportPermitConsumeApplicationPreflight {
  status: MemoryCacheAuditExportPermitConsumeApplicationPreflightStatus;
  consumeApplicationPreflightAllowed: boolean;
  permitConsumeAuthorized: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitId?: string;
  consumeAuthorityId?: string;
  applicationRef?: string;
  operatorRef?: string;
  applicationPolicyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  consumeApplication: {
    kind: 'memory_cache_audit_export_permit_consume_application_preflight';
    permitKind: 'memory_cache_audit_export';
    permitRef?: string;
    authorityRef?: string;
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

export function preflightMemoryCacheAuditExportPermitConsumeApplication(
  input: MemoryCacheAuditExportPermitConsumeApplicationPreflightInput,
): MemoryCacheAuditExportPermitConsumeApplicationPreflight {
  const applicationRef = normalize(input.applicationRef);
  const operatorRef = normalize(input.operatorRef);
  const applicationPolicyRef = normalize(input.applicationPolicyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.authority.status === 'blocked') {
    blockers.push(...input.authority.blockers.map((blocker) => `memory_cache_audit_export_permit_consume_application_preflight.authority_blocked:${blocker}`));
  }
  if (input.authority.status === 'review_required') {
    reviewItems.push(...input.authority.reviewItems.map((item) => `memory_cache_audit_export_permit_consume_application_preflight.authority_review_required:${item}`));
  }
  if (!input.authority.permitConsumeAuthorityAllowed) {
    blockers.push('memory_cache_audit_export_permit_consume_application_preflight.authority_not_allowed');
  }
  if (!input.authority.permitConsumeAuthorized) {
    blockers.push('memory_cache_audit_export_permit_consume_application_preflight.consume_must_be_authorized');
  }
  if (
    input.authority.permitConsumed !== false
    || input.authority.fileWriteAllowed !== false
    || input.authority.durablePersistenceAllowed !== false
    || input.authority.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_consume_application_preflight.write_and_external_gates_must_stay_closed');
  }
  if (!applicationRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_application_preflight.application_ref_required');
  }
  if (!operatorRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_application_preflight.operator_ref_required');
  }
  if (!applicationPolicyRef) {
    reviewItems.push('memory_cache_audit_export_permit_consume_application_preflight.application_policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitConsumeApplicationPreflightStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    consumeApplicationPreflightAllowed: status === 'ready',
    permitConsumeAuthorized: input.authority.permitConsumeAuthorized,
    permitIssued: input.authority.permitIssued,
    permitConsumed: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(input.authority.permitId ? { permitId: input.authority.permitId } : {}),
    ...(input.authority.consumeAuthorityId ? { consumeAuthorityId: input.authority.consumeAuthorityId } : {}),
    ...(applicationRef ? { applicationRef } : {}),
    ...(operatorRef ? { operatorRef } : {}),
    ...(applicationPolicyRef ? { applicationPolicyRef } : {}),
    format: input.authority.format,
    cacheRef: input.authority.cacheRef,
    previewLines: [...input.authority.previewLines],
    evidenceRefs: unique([...input.authority.evidenceRefs, applicationRef, applicationPolicyRef]),
    consumeApplication: {
      kind: 'memory_cache_audit_export_permit_consume_application_preflight',
      permitKind: 'memory_cache_audit_export',
      ...(input.authority.permitId ? { permitRef: input.authority.permitId } : {}),
      ...(input.authority.consumeAuthorityId ? { authorityRef: input.authority.consumeAuthorityId } : {}),
      ...(applicationPolicyRef ? { policyRef: applicationPolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_application_authority']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_consume_application_preflight_review']
        : ['resolve_memory_cache_audit_export_permit_consume_application_preflight_blockers'],
  };
}
