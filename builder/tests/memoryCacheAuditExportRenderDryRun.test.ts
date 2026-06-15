import assert from 'node:assert/strict';

import { renderMemoryCacheAuditExportDryRun } from '../src/memoryCacheAuditExportRenderDryRun.js';
import type { MemoryCacheAuditExportEvidencePack } from '../src/memoryCacheAuditExportEvidencePack.js';

const evidencePack: MemoryCacheAuditExportEvidencePack = {
  status: 'ready',
  evidencePackAllowed: true,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  evidencePackRef: 'evidence-pack:aicos-cache-audit',
  reviewerRef: 'reviewer:operator',
  format: 'markdown',
  cacheRef: 'memory:aicos-cards',
  eventCount: 2,
  manifest: {
    auditRef: 'audit:aicos-cache-invalidation',
    eventIds: ['prior_read_status', 'invalidation_status'],
  },
  evidenceRefs: ['review-packets/BPK-068.md'],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyRenderDryRun(): void {
  const dryRun = renderMemoryCacheAuditExportDryRun({
    evidencePack,
    renderRef: 'render:aicos-cache-audit',
    rendererRef: 'renderer:operator-preview',
  });

  assert.equal(dryRun.status, 'ready');
  assert.equal(dryRun.renderDryRunAllowed, true);
  assert.equal(dryRun.fileWriteAllowed, false);
  assert.equal(dryRun.durablePersistenceAllowed, false);
  assert.ok(dryRun.preview.includes('eventCount: 2'));
}

function testMissingRenderRefRequiresReview(): void {
  const dryRun = renderMemoryCacheAuditExportDryRun({
    evidencePack,
    rendererRef: 'renderer:operator-preview',
  });

  assert.equal(dryRun.status, 'review_required');
  assert.ok(dryRun.reviewItems.includes('memory_cache_audit_export_render_dry_run.render_ref_required'));
}

function testBlockedEvidencePackBlocksRenderDryRun(): void {
  const dryRun = renderMemoryCacheAuditExportDryRun({
    evidencePack: {
      ...evidencePack,
      status: 'blocked',
      evidencePackAllowed: false,
      blockers: ['memory_cache_audit_export_evidence.export_contract_not_allowed'],
    },
    renderRef: 'render:aicos-cache-audit',
    rendererRef: 'renderer:operator-preview',
  });

  assert.equal(dryRun.status, 'blocked');
  assert.ok(dryRun.blockers.includes('memory_cache_audit_export_render_dry_run.evidence_pack_not_allowed'));
}

testReadyRenderDryRun();
testMissingRenderRefRequiresReview();
testBlockedEvidencePackBlocksRenderDryRun();

console.log('memoryCacheAuditExportRenderDryRun tests passed');
