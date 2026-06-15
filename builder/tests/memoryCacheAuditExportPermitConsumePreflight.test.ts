import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsume } from '../src/memoryCacheAuditExportPermitConsumePreflight.js';
import type { MemoryCacheAuditExportPermitIssueAuthority } from '../src/memoryCacheAuditExportPermitIssueAuthority.js';

const authority: MemoryCacheAuditExportPermitIssueAuthority = {
  status: 'ready',
  permitIssueAuthorityAllowed: true,
  permitIssued: true,
  permitConsumed: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  issuedByRef: 'issuer:authority',
  expiresAtRef: 'expiry:bounded-window',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-112.md'],
  issuedPermit: {
    kind: 'memory_cache_audit_export_permit',
    permitKind: 'memory_cache_audit_export',
    preflightRef: 'preflight:memory',
    policyRef: 'policy:export-permit-issue',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyConsumePreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsume({
    authority,
    consumeRef: 'consume:memory',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.permitConsumePreflightAllowed, true);
  assert.equal(preflight.permitIssued, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.permitConsume.kind, 'memory_cache_audit_export_permit_consume_preflight');
}

function testMissingConsumeRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsume({
    authority,
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.permitConsumePreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_preflight.consume_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsume({
    authority: { ...authority, status: 'blocked', permitIssueAuthorityAllowed: false, permitIssued: false, blockers: ['blocked'] },
    consumeRef: 'consume:memory',
    consumerRef: 'consumer:operator',
    consumePolicyRef: 'policy:consume',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.permitConsumePreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_preflight.authority_not_allowed'));
}

testReadyConsumePreflightKeepsSideEffectsClosed();
testMissingConsumeRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('memoryCacheAuditExportPermitConsumePreflight tests passed');
