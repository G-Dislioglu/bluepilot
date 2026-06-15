import assert from 'node:assert/strict';

import { buildMemoryCacheAuditExportContract } from '../src/memoryCacheAuditExportContract.js';
import type { MemoryCacheInvalidationAuditTrail } from '../src/memoryCacheInvalidationAuditTrail.js';

const auditTrail: MemoryCacheInvalidationAuditTrail = {
  status: 'ready',
  auditTrailAllowed: true,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  auditRef: 'audit:aicos-cache-invalidation',
  auditorRef: 'auditor:operator',
  cacheRef: 'memory:aicos-cards',
  events: [
    { id: 'prior_read_status', detail: 'fresh' },
    { id: 'invalidation_status', detail: 'invalidated' },
  ],
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditExportContract(): void {
  const contract = buildMemoryCacheAuditExportContract({
    auditTrail,
    exportRef: 'export:aicos-cache-audit',
    consumerRef: 'consumer:operator-review',
    format: 'markdown',
  });

  assert.equal(contract.status, 'ready');
  assert.equal(contract.exportContractAllowed, true);
  assert.equal(contract.fileWriteAllowed, false);
  assert.equal(contract.durablePersistenceAllowed, false);
  assert.equal(contract.externalActionAllowed, false);
  assert.deepEqual(contract.manifest.eventIds, ['prior_read_status', 'invalidation_status']);
}

function testMissingExportRefRequiresReview(): void {
  const contract = buildMemoryCacheAuditExportContract({
    auditTrail,
    consumerRef: 'consumer:operator-review',
  });

  assert.equal(contract.status, 'review_required');
  assert.ok(contract.reviewItems.includes('memory_cache_audit_export.export_ref_required'));
}

function testBlockedAuditTrailBlocksExport(): void {
  const contract = buildMemoryCacheAuditExportContract({
    auditTrail: {
      ...auditTrail,
      status: 'blocked',
      auditTrailAllowed: false,
      blockers: ['aicos_cache_invalidation_audit.binding_not_allowed'],
    },
    exportRef: 'export:aicos-cache-audit',
    consumerRef: 'consumer:operator-review',
  });

  assert.equal(contract.status, 'blocked');
  assert.ok(contract.blockers.includes('memory_cache_audit_export.audit_trail_not_allowed'));
}

testReadyAuditExportContract();
testMissingExportRefRequiresReview();
testBlockedAuditTrailBlocksExport();

console.log('memoryCacheAuditExportContract tests passed');
