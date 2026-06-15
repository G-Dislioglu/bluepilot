import type { MemoryCacheAuditExportPermitIssuePreflight } from './memoryCacheAuditExportPermitIssuePreflight.js';

export type MemoryCacheAuditExportPermitIssueAuthorityStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitIssueAuthorityInput {
  preflight: MemoryCacheAuditExportPermitIssuePreflight;
  permitId?: string;
  issuedByRef?: string;
  expiresAtRef?: string;
}

export interface MemoryCacheAuditExportPermitIssueAuthority {
  status: MemoryCacheAuditExportPermitIssueAuthorityStatus;
  permitIssueAuthorityAllowed: boolean;
  permitIssued: boolean;
  permitConsumed: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  permitId?: string;
  issuedByRef?: string;
  expiresAtRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  issuedPermit: {
    kind: 'memory_cache_audit_export_permit';
    permitKind: 'memory_cache_audit_export';
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

export function issueMemoryCacheAuditExportPermitAuthority(
  input: MemoryCacheAuditExportPermitIssueAuthorityInput,
): MemoryCacheAuditExportPermitIssueAuthority {
  const permitId = normalize(input.permitId);
  const issuedByRef = normalize(input.issuedByRef);
  const expiresAtRef = normalize(input.expiresAtRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.preflight.status === 'blocked') {
    blockers.push(...input.preflight.blockers.map((blocker) => `memory_cache_audit_export_permit_issue_authority.preflight_blocked:${blocker}`));
  }
  if (input.preflight.status === 'review_required') {
    reviewItems.push(...input.preflight.reviewItems.map((item) => `memory_cache_audit_export_permit_issue_authority.preflight_review_required:${item}`));
  }
  if (!input.preflight.permitIssuePreflightAllowed) {
    blockers.push('memory_cache_audit_export_permit_issue_authority.preflight_not_allowed');
  }
  if (
    input.preflight.permitIssued !== false
    || input.preflight.fileWriteAllowed !== false
    || input.preflight.durablePersistenceAllowed !== false
    || input.preflight.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_issue_authority.write_and_external_gates_must_stay_closed');
  }
  if (!permitId) {
    reviewItems.push('memory_cache_audit_export_permit_issue_authority.permit_id_required');
  }
  if (!issuedByRef) {
    reviewItems.push('memory_cache_audit_export_permit_issue_authority.issued_by_ref_required');
  }
  if (!expiresAtRef) {
    reviewItems.push('memory_cache_audit_export_permit_issue_authority.expires_at_ref_required');
  }

  const status: MemoryCacheAuditExportPermitIssueAuthorityStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitIssueAuthorityAllowed: status === 'ready',
    permitIssued: status === 'ready',
    permitConsumed: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(permitId ? { permitId } : {}),
    ...(issuedByRef ? { issuedByRef } : {}),
    ...(expiresAtRef ? { expiresAtRef } : {}),
    format: input.preflight.format,
    cacheRef: input.preflight.cacheRef,
    previewLines: [...input.preflight.previewLines],
    evidenceRefs: unique([...input.preflight.evidenceRefs, permitId, expiresAtRef]),
    issuedPermit: {
      kind: 'memory_cache_audit_export_permit',
      permitKind: 'memory_cache_audit_export',
      ...(input.preflight.preflightRef ? { preflightRef: input.preflight.preflightRef } : {}),
      ...(input.preflight.issuePolicyRef ? { policyRef: input.preflight.issuePolicyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_consume_preflight']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_issue_authority_review']
        : ['resolve_memory_cache_audit_export_permit_issue_authority_blockers'],
  };
}
