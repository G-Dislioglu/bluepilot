import type { MemoryCacheAuditExportPermitPrepEvidence } from './memoryCacheAuditExportPermitPrepEvidence.js';

export type MemoryCacheAuditExportPermitIssuanceReadinessStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitIssuanceReadinessInput {
  evidence: MemoryCacheAuditExportPermitPrepEvidence;
  issuanceReadinessRef?: string;
  issuerRef?: string;
  policyRef?: string;
}

export interface MemoryCacheAuditExportPermitIssuanceReadiness {
  status: MemoryCacheAuditExportPermitIssuanceReadinessStatus;
  permitIssuanceReadinessAllowed: boolean;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  issuanceReadinessRef?: string;
  issuerRef?: string;
  policyRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  permitRequest: {
    kind: 'memory_cache_audit_export';
    decisionRef?: string;
    approvalRef?: string;
  };
  issuanceGate: {
    kind: 'memory_cache_audit_export_permit_issuance';
    evidenceRef?: string;
    reviewerRef?: string;
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

export function buildMemoryCacheAuditExportPermitIssuanceReadiness(
  input: MemoryCacheAuditExportPermitIssuanceReadinessInput,
): MemoryCacheAuditExportPermitIssuanceReadiness {
  const issuanceReadinessRef = normalize(input.issuanceReadinessRef);
  const issuerRef = normalize(input.issuerRef);
  const policyRef = normalize(input.policyRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidence.status === 'blocked') {
    blockers.push(...input.evidence.blockers.map((blocker) => `memory_cache_audit_export_permit_issuance_readiness.evidence_blocked:${blocker}`));
  }
  if (input.evidence.status === 'review_required') {
    reviewItems.push(...input.evidence.reviewItems.map((item) => `memory_cache_audit_export_permit_issuance_readiness.evidence_review_required:${item}`));
  }
  if (!input.evidence.evidencePackAllowed) {
    blockers.push('memory_cache_audit_export_permit_issuance_readiness.evidence_pack_not_allowed');
  }
  if (
    input.evidence.permitIssued !== false
    || input.evidence.fileWriteAllowed !== false
    || input.evidence.durablePersistenceAllowed !== false
    || input.evidence.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_issuance_readiness.write_and_external_gates_must_stay_closed');
  }
  if (!issuanceReadinessRef) {
    reviewItems.push('memory_cache_audit_export_permit_issuance_readiness.issuance_readiness_ref_required');
  }
  if (!issuerRef) {
    reviewItems.push('memory_cache_audit_export_permit_issuance_readiness.issuer_ref_required');
  }
  if (!policyRef) {
    reviewItems.push('memory_cache_audit_export_permit_issuance_readiness.policy_ref_required');
  }

  const status: MemoryCacheAuditExportPermitIssuanceReadinessStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    permitIssuanceReadinessAllowed: status === 'ready',
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(issuanceReadinessRef ? { issuanceReadinessRef } : {}),
    ...(issuerRef ? { issuerRef } : {}),
    ...(policyRef ? { policyRef } : {}),
    format: input.evidence.format,
    cacheRef: input.evidence.cacheRef,
    previewLines: [...input.evidence.previewLines],
    evidenceRefs: unique([...input.evidence.evidenceRefs, input.evidence.evidenceRef ?? '', policyRef]),
    permitRequest: { ...input.evidence.permitRequest },
    issuanceGate: {
      kind: 'memory_cache_audit_export_permit_issuance',
      ...(input.evidence.evidenceRef ? { evidenceRef: input.evidence.evidenceRef } : {}),
      ...(input.evidence.reviewerRef ? { reviewerRef: input.evidence.reviewerRef } : {}),
      ...(policyRef ? { policyRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['open_task_lock_for_memory_cache_audit_export_permit_issuance']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_issuance_readiness_review']
        : ['resolve_memory_cache_audit_export_permit_issuance_readiness_blockers'],
  };
}
