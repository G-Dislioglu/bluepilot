import type { MemoryCacheAuditExportContract } from './memoryCacheAuditExportContract.js';

export type MemoryCacheAuditExportEvidencePackStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportEvidencePackInput {
  exportContract: MemoryCacheAuditExportContract;
  evidencePackRef?: string;
  reviewerRef?: string;
  evidenceRefs?: string[];
}

export interface MemoryCacheAuditExportEvidencePack {
  status: MemoryCacheAuditExportEvidencePackStatus;
  evidencePackAllowed: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  evidencePackRef?: string;
  reviewerRef?: string;
  format: string;
  cacheRef: string;
  eventCount: number;
  manifest: {
    auditRef?: string;
    eventIds: string[];
  };
  evidenceRefs: string[];
  blockers: string[];
  reviewItems: string[];
  nextActions: string[];
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

function normalizeRefs(values: string[] | undefined): string[] {
  return [...new Set((values ?? []).map((value) => normalize(value)).filter(Boolean))];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildMemoryCacheAuditExportEvidencePack(
  input: MemoryCacheAuditExportEvidencePackInput,
): MemoryCacheAuditExportEvidencePack {
  const evidencePackRef = normalize(input.evidencePackRef);
  const reviewerRef = normalize(input.reviewerRef);
  const evidenceRefs = normalizeRefs(input.evidenceRefs);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.exportContract.status === 'blocked') {
    blockers.push(...input.exportContract.blockers.map((blocker) => `memory_cache_audit_export_evidence.contract_blocked:${blocker}`));
  }
  if (input.exportContract.status === 'review_required') {
    reviewItems.push(...input.exportContract.reviewItems.map((item) => `memory_cache_audit_export_evidence.contract_review_required:${item}`));
  }
  if (!input.exportContract.exportContractAllowed) {
    blockers.push('memory_cache_audit_export_evidence.export_contract_not_allowed');
  }
  if (input.exportContract.fileWriteAllowed !== false) {
    blockers.push('memory_cache_audit_export_evidence.file_write_must_stay_closed');
  }
  if (input.exportContract.durablePersistenceAllowed !== false || input.exportContract.externalActionAllowed !== false) {
    blockers.push('memory_cache_audit_export_evidence.persistence_and_external_actions_must_stay_closed');
  }
  if (input.exportContract.eventCount !== input.exportContract.manifest.eventIds.length) {
    blockers.push('memory_cache_audit_export_evidence.event_manifest_count_mismatch');
  }
  if (!evidencePackRef) {
    reviewItems.push('memory_cache_audit_export_evidence.evidence_pack_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('memory_cache_audit_export_evidence.reviewer_ref_required');
  }
  if (evidenceRefs.length === 0) {
    reviewItems.push('memory_cache_audit_export_evidence.evidence_refs_required');
  }

  const status: MemoryCacheAuditExportEvidencePackStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    evidencePackAllowed: status === 'ready',
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(evidencePackRef ? { evidencePackRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    format: input.exportContract.format,
    cacheRef: input.exportContract.cacheRef,
    eventCount: input.exportContract.eventCount,
    manifest: {
      ...input.exportContract.manifest,
      eventIds: [...input.exportContract.manifest.eventIds],
    },
    evidenceRefs,
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_memory_cache_audit_export_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_evidence_review']
        : ['resolve_memory_cache_audit_export_evidence_blockers'],
  };
}
