import assert from 'node:assert/strict';

import { buildMemoryCacheAuditExportPreviewEvidence } from '../src/memoryCacheAuditExportPreviewEvidence.js';
import type { MemoryCacheAuditExportRenderDryRun } from '../src/memoryCacheAuditExportRenderDryRun.js';

const renderDryRun: MemoryCacheAuditExportRenderDryRun = {
  status: 'ready',
  renderDryRunAllowed: true,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  renderRef: 'render:aicos-cache-audit',
  rendererRef: 'renderer:operator-preview',
  format: 'markdown',
  cacheRef: 'memory:aicos-cards',
  preview: 'cacheRef: memory:aicos-cards\neventCount: 2',
  previewLines: ['cacheRef: memory:aicos-cards', 'eventCount: 2'],
  evidenceRefs: ['review-packets/BPK-072.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyPreviewEvidence(): void {
  const evidence = buildMemoryCacheAuditExportPreviewEvidence({
    renderDryRun,
    evidenceRef: 'evidence:aicos-cache-preview',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-076.md'],
  });

  assert.equal(evidence.status, 'ready');
  assert.equal(evidence.evidencePackAllowed, true);
  assert.equal(evidence.fileWriteAllowed, false);
  assert.equal(evidence.durablePersistenceAllowed, false);
  assert.ok(evidence.preview.includes('eventCount: 2'));
  assert.deepEqual(evidence.evidenceRefs, ['review-packets/BPK-072.md', 'review-packets/BPK-076.md']);
}

function testMissingEvidenceRefRequiresReview(): void {
  const evidence = buildMemoryCacheAuditExportPreviewEvidence({
    renderDryRun,
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-076.md'],
  });

  assert.equal(evidence.status, 'review_required');
  assert.ok(evidence.reviewItems.includes('memory_cache_audit_preview_evidence.evidence_ref_required'));
}

function testBlockedRenderDryRunBlocksEvidence(): void {
  const evidence = buildMemoryCacheAuditExportPreviewEvidence({
    renderDryRun: {
      ...renderDryRun,
      status: 'blocked',
      renderDryRunAllowed: false,
      blockers: ['memory_cache_audit_export_render_dry_run.evidence_pack_not_allowed'],
    },
    evidenceRef: 'evidence:aicos-cache-preview',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-076.md'],
  });

  assert.equal(evidence.status, 'blocked');
  assert.ok(evidence.blockers.includes('memory_cache_audit_preview_evidence.render_dry_run_not_allowed'));
}

testReadyPreviewEvidence();
testMissingEvidenceRefRequiresReview();
testBlockedRenderDryRunBlocksEvidence();

console.log('memoryCacheAuditExportPreviewEvidence tests passed');
