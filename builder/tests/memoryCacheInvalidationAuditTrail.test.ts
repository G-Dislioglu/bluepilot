import assert from 'node:assert/strict';

import { buildMemoryCacheInvalidationAuditTrail } from '../src/memoryCacheInvalidationAuditTrail.js';
import type { MemoryCacheInvalidationEvidenceBinding } from '../src/memoryCacheInvalidationEvidenceBinding.js';

const binding: MemoryCacheInvalidationEvidenceBinding = {
  status: 'ready',
  evidenceBindingAllowed: true,
  durablePersistenceAllowed: false,
  cacheRef: 'memory:aicos-cards',
  evidenceRef: 'review-packets/BPK-052.md',
  invalidationStatus: 'invalidated',
  priorReadStatus: 'fresh',
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuditTrail(): void {
  const audit = buildMemoryCacheInvalidationAuditTrail({
    binding,
    auditRef: 'audit:aicos-cache-invalidation',
    auditorRef: 'auditor:operator',
  });

  assert.equal(audit.status, 'ready');
  assert.equal(audit.auditTrailAllowed, true);
  assert.equal(audit.durablePersistenceAllowed, false);
  assert.equal(audit.externalActionAllowed, false);
  assert.ok(audit.events.some((event) => event.id === 'invalidation_status'));
}

function testMissingAuditRefRequiresReview(): void {
  const audit = buildMemoryCacheInvalidationAuditTrail({
    binding,
    auditorRef: 'auditor:operator',
  });

  assert.equal(audit.status, 'review_required');
  assert.ok(audit.reviewItems.includes('aicos_cache_invalidation_audit.audit_ref_required'));
}

function testBlockedBindingBlocksAuditTrail(): void {
  const audit = buildMemoryCacheInvalidationAuditTrail({
    binding: {
      ...binding,
      status: 'blocked',
      evidenceBindingAllowed: false,
      blockers: ['aicos_cache_invalidation_evidence.invalidation_not_confirmed'],
    },
    auditRef: 'audit:aicos-cache-invalidation',
    auditorRef: 'auditor:operator',
  });

  assert.equal(audit.status, 'blocked');
  assert.ok(audit.blockers.includes('aicos_cache_invalidation_audit.binding_not_allowed'));
}

testReadyAuditTrail();
testMissingAuditRefRequiresReview();
testBlockedBindingBlocksAuditTrail();

console.log('memoryCacheInvalidationAuditTrail tests passed');
