import type { MemoryCacheAuditExportApprovedActionPermitPrep } from './memoryCacheAuditExportApprovedActionPermitPrep.js';

export type MemoryCacheAuditExportPermitPrepEvidenceStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPermitPrepEvidenceInput {
  permitPrep: MemoryCacheAuditExportApprovedActionPermitPrep;
  evidenceRef?: string;
  reviewerRef?: string;
  evidenceRefs?: string[];
}

export interface MemoryCacheAuditExportPermitPrepEvidence {
  status: MemoryCacheAuditExportPermitPrepEvidenceStatus;
  evidencePackAllowed: boolean;
  permitIssued: false;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  evidenceRef?: string;
  reviewerRef?: string;
  format: string;
  cacheRef: string;
  previewLines: string[];
  evidenceRefs: string[];
  permitRequest: {
    kind: 'memory_cache_audit_export';
    decisionRef?: string;
    approvalRef?: string;
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

export function buildMemoryCacheAuditExportPermitPrepEvidence(
  input: MemoryCacheAuditExportPermitPrepEvidenceInput,
): MemoryCacheAuditExportPermitPrepEvidence {
  const evidenceRef = normalize(input.evidenceRef);
  const reviewerRef = normalize(input.reviewerRef);
  const suppliedEvidenceRefs = unique((input.evidenceRefs ?? []).map((ref) => ref.trim()));
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.permitPrep.status === 'blocked') {
    blockers.push(...input.permitPrep.blockers.map((blocker) => `memory_cache_audit_export_permit_prep_evidence.permit_prep_blocked:${blocker}`));
  }
  if (input.permitPrep.status === 'review_required') {
    reviewItems.push(...input.permitPrep.reviewItems.map((item) => `memory_cache_audit_export_permit_prep_evidence.permit_prep_review_required:${item}`));
  }
  if (!input.permitPrep.permitPrepAllowed) {
    blockers.push('memory_cache_audit_export_permit_prep_evidence.permit_prep_not_allowed');
  }
  if (input.permitPrep.permitIssued !== false) {
    blockers.push('memory_cache_audit_export_permit_prep_evidence.permit_must_not_be_issued');
  }
  if (
    input.permitPrep.fileWriteAllowed !== false
    || input.permitPrep.durablePersistenceAllowed !== false
    || input.permitPrep.externalActionAllowed !== false
  ) {
    blockers.push('memory_cache_audit_export_permit_prep_evidence.write_and_external_gates_must_stay_closed');
  }
  if (!evidenceRef) {
    reviewItems.push('memory_cache_audit_export_permit_prep_evidence.evidence_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('memory_cache_audit_export_permit_prep_evidence.reviewer_ref_required');
  }
  if (suppliedEvidenceRefs.length === 0) {
    reviewItems.push('memory_cache_audit_export_permit_prep_evidence.evidence_refs_required');
  }

  const status: MemoryCacheAuditExportPermitPrepEvidenceStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidencePackAllowed: status === 'ready',
    permitIssued: false,
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(evidenceRef ? { evidenceRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    format: input.permitPrep.format,
    cacheRef: input.permitPrep.cacheRef,
    previewLines: [...input.permitPrep.previewLines],
    evidenceRefs: unique([...input.permitPrep.evidenceRefs, ...suppliedEvidenceRefs, evidenceRef]),
    permitRequest: {
      kind: 'memory_cache_audit_export',
      ...(input.permitPrep.permitRequest.decisionRef ? { decisionRef: input.permitPrep.permitRequest.decisionRef } : {}),
      ...(input.permitPrep.permitRequest.approvalRef ? { approvalRef: input.permitPrep.permitRequest.approvalRef } : {}),
    },
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_memory_cache_audit_export_permit_prep_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_permit_prep_evidence_review']
        : ['resolve_memory_cache_audit_export_permit_prep_evidence_blockers'],
  };
}
