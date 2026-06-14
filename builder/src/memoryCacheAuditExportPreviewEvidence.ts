import type { MemoryCacheAuditExportRenderDryRun } from './memoryCacheAuditExportRenderDryRun.js';

export type MemoryCacheAuditExportPreviewEvidenceStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportPreviewEvidenceInput {
  renderDryRun: MemoryCacheAuditExportRenderDryRun;
  evidenceRef?: string;
  reviewerRef?: string;
  evidenceRefs?: string[];
}

export interface MemoryCacheAuditExportPreviewEvidence {
  status: MemoryCacheAuditExportPreviewEvidenceStatus;
  evidencePackAllowed: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  evidenceRef?: string;
  reviewerRef?: string;
  format: string;
  cacheRef: string;
  preview: string;
  previewLines: string[];
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

export function buildMemoryCacheAuditExportPreviewEvidence(
  input: MemoryCacheAuditExportPreviewEvidenceInput,
): MemoryCacheAuditExportPreviewEvidence {
  const evidenceRef = normalize(input.evidenceRef);
  const reviewerRef = normalize(input.reviewerRef);
  const evidenceRefs = normalizeRefs(input.evidenceRefs);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.renderDryRun.status === 'blocked') {
    blockers.push(...input.renderDryRun.blockers.map((blocker) => `memory_cache_audit_preview_evidence.render_blocked:${blocker}`));
  }
  if (input.renderDryRun.status === 'review_required') {
    reviewItems.push(...input.renderDryRun.reviewItems.map((item) => `memory_cache_audit_preview_evidence.render_review_required:${item}`));
  }
  if (!input.renderDryRun.renderDryRunAllowed) {
    blockers.push('memory_cache_audit_preview_evidence.render_dry_run_not_allowed');
  }
  if (input.renderDryRun.fileWriteAllowed !== false) {
    blockers.push('memory_cache_audit_preview_evidence.file_write_must_stay_closed');
  }
  if (input.renderDryRun.durablePersistenceAllowed !== false || input.renderDryRun.externalActionAllowed !== false) {
    blockers.push('memory_cache_audit_preview_evidence.persistence_and_external_actions_must_stay_closed');
  }
  if (!evidenceRef) {
    reviewItems.push('memory_cache_audit_preview_evidence.evidence_ref_required');
  }
  if (!reviewerRef) {
    reviewItems.push('memory_cache_audit_preview_evidence.reviewer_ref_required');
  }
  if (evidenceRefs.length === 0) {
    reviewItems.push('memory_cache_audit_preview_evidence.evidence_refs_required');
  }

  const status: MemoryCacheAuditExportPreviewEvidenceStatus = blockers.length > 0
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
    ...(evidenceRef ? { evidenceRef } : {}),
    ...(reviewerRef ? { reviewerRef } : {}),
    format: input.renderDryRun.format,
    cacheRef: input.renderDryRun.cacheRef,
    preview: input.renderDryRun.preview,
    previewLines: [...input.renderDryRun.previewLines],
    evidenceRefs: unique([...input.renderDryRun.evidenceRefs, ...evidenceRefs]),
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['attach_memory_cache_audit_preview_evidence_to_operator_review']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_preview_evidence_review']
        : ['resolve_memory_cache_audit_preview_evidence_blockers'],
  };
}
