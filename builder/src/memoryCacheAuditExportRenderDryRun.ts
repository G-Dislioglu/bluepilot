import type { MemoryCacheAuditExportEvidencePack } from './memoryCacheAuditExportEvidencePack.js';

export type MemoryCacheAuditExportRenderDryRunStatus = 'ready' | 'review_required' | 'blocked';

export interface MemoryCacheAuditExportRenderDryRunInput {
  evidencePack: MemoryCacheAuditExportEvidencePack;
  renderRef?: string;
  rendererRef?: string;
}

export interface MemoryCacheAuditExportRenderDryRun {
  status: MemoryCacheAuditExportRenderDryRunStatus;
  renderDryRunAllowed: boolean;
  fileWriteAllowed: false;
  durablePersistenceAllowed: false;
  externalActionAllowed: false;
  renderRef?: string;
  rendererRef?: string;
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

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function renderMemoryCacheAuditExportDryRun(
  input: MemoryCacheAuditExportRenderDryRunInput,
): MemoryCacheAuditExportRenderDryRun {
  const renderRef = normalize(input.renderRef);
  const rendererRef = normalize(input.rendererRef);
  const blockers: string[] = [];
  const reviewItems: string[] = [];

  if (input.evidencePack.status === 'blocked') {
    blockers.push(...input.evidencePack.blockers.map((blocker) => `memory_cache_audit_export_render_dry_run.evidence_blocked:${blocker}`));
  }
  if (input.evidencePack.status === 'review_required') {
    reviewItems.push(...input.evidencePack.reviewItems.map((item) => `memory_cache_audit_export_render_dry_run.evidence_review_required:${item}`));
  }
  if (!input.evidencePack.evidencePackAllowed) {
    blockers.push('memory_cache_audit_export_render_dry_run.evidence_pack_not_allowed');
  }
  if (input.evidencePack.fileWriteAllowed !== false) {
    blockers.push('memory_cache_audit_export_render_dry_run.file_write_must_stay_closed');
  }
  if (input.evidencePack.durablePersistenceAllowed !== false || input.evidencePack.externalActionAllowed !== false) {
    blockers.push('memory_cache_audit_export_render_dry_run.persistence_and_external_actions_must_stay_closed');
  }
  if (!renderRef) {
    reviewItems.push('memory_cache_audit_export_render_dry_run.render_ref_required');
  }
  if (!rendererRef) {
    reviewItems.push('memory_cache_audit_export_render_dry_run.renderer_ref_required');
  }

  const previewLines = [
    `cacheRef: ${input.evidencePack.cacheRef}`,
    `format: ${input.evidencePack.format}`,
    `eventCount: ${input.evidencePack.eventCount}`,
    `eventIds: ${input.evidencePack.manifest.eventIds.join(', ')}`,
    `evidenceRefs: ${input.evidencePack.evidenceRefs.join(', ')}`,
  ];

  const status: MemoryCacheAuditExportRenderDryRunStatus = blockers.length > 0
    ? 'blocked'
    : reviewItems.length > 0
      ? 'review_required'
      : 'ready';

  return {
    status,
    renderDryRunAllowed: status === 'ready',
    fileWriteAllowed: false,
    durablePersistenceAllowed: false,
    externalActionAllowed: false,
    ...(renderRef ? { renderRef } : {}),
    ...(rendererRef ? { rendererRef } : {}),
    format: input.evidencePack.format,
    cacheRef: input.evidencePack.cacheRef,
    preview: previewLines.join('\n'),
    previewLines,
    evidenceRefs: [...input.evidencePack.evidenceRefs],
    blockers: unique(blockers),
    reviewItems: unique(reviewItems),
    nextActions: status === 'ready'
      ? ['record_memory_cache_audit_export_render_dry_run_evidence']
      : status === 'review_required'
        ? ['complete_memory_cache_audit_export_render_dry_run_review']
        : ['resolve_memory_cache_audit_export_render_dry_run_blockers'],
  };
}
