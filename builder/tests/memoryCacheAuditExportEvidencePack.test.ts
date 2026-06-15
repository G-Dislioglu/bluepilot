import assert from 'node:assert/strict';

import { buildMemoryCacheAuditExportEvidencePack } from '../src/memoryCacheAuditExportEvidencePack.js';
import type { MemoryCacheAuditExportContract } from '../src/memoryCacheAuditExportContract.js';

const exportContract: MemoryCacheAuditExportContract = {
  status: 'ready',
  exportContractAllowed: true,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  exportRef: 'export:aicos-cache-audit',
  consumerRef: 'consumer:operator-review',
  format: 'markdown',
  cacheRef: 'memory:aicos-cards',
  eventCount: 2,
  manifest: {
    auditRef: 'audit:aicos-cache-invalidation',
    eventIds: ['prior_read_status', 'invalidation_status'],
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditExportEvidencePack(): void {
  const pack = buildMemoryCacheAuditExportEvidencePack({
    exportContract,
    evidencePackRef: 'evidence-pack:aicos-cache-audit',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-064.md'],
  });

  assert.equal(pack.status, 'ready');
  assert.equal(pack.evidencePackAllowed, true);
  assert.equal(pack.fileWriteAllowed, false);
  assert.equal(pack.durablePersistenceAllowed, false);
  assert.deepEqual(pack.manifest.eventIds, ['prior_read_status', 'invalidation_status']);
}

function testMissingEvidenceRefRequiresReview(): void {
  const pack = buildMemoryCacheAuditExportEvidencePack({
    exportContract,
    evidencePackRef: 'evidence-pack:aicos-cache-audit',
    reviewerRef: 'reviewer:operator',
  });

  assert.equal(pack.status, 'review_required');
  assert.ok(pack.reviewItems.includes('memory_cache_audit_export_evidence.evidence_refs_required'));
}

function testBlockedExportContractBlocksEvidencePack(): void {
  const pack = buildMemoryCacheAuditExportEvidencePack({
    exportContract: {
      ...exportContract,
      status: 'blocked',
      exportContractAllowed: false,
      blockers: ['memory_cache_audit_export.audit_trail_not_allowed'],
    },
    evidencePackRef: 'evidence-pack:aicos-cache-audit',
    reviewerRef: 'reviewer:operator',
    evidenceRefs: ['review-packets/BPK-064.md'],
  });

  assert.equal(pack.status, 'blocked');
  assert.ok(pack.blockers.includes('memory_cache_audit_export_evidence.export_contract_not_allowed'));
}

testReadyAuditExportEvidencePack();
testMissingEvidenceRefRequiresReview();
testBlockedExportContractBlocksEvidencePack();

console.log('memoryCacheAuditExportEvidencePack tests passed');
