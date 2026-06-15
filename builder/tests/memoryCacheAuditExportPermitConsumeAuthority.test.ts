import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsume } from '../src/memoryCacheAuditExportPermitConsumeAuthority.js';
import type { MemoryCacheAuditExportPermitConsumePreflight } from '../src/memoryCacheAuditExportPermitConsumePreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumePreflight = {
  status: 'ready',
  permitConsumePreflightAllowed: true,
  permitIssued: true,
  permitConsumed: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  consumeRef: 'consume:memory',
  consumerRef: 'consumer:operator',
  consumePolicyRef: 'policy:consume',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-116.md'],
  permitConsume: {
    kind: 'memory_cache_audit_export_permit_consume_preflight',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    authorityRef: 'issuer:authority',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesConsumeWithoutConsuming(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsume({
    preflight,
    consumeAuthorityId: 'consume-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.permitConsumeAuthorityAllowed, true);
  assert.equal(authority.permitConsumeAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.authorizedConsume.kind, 'memory_cache_audit_export_permit_consume_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsume({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.permitConsumeAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_authority.consume_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsume({
    preflight: { ...preflight, status: 'blocked', permitConsumePreflightAllowed: false, permitIssued: false, blockers: ['blocked'] },
    consumeAuthorityId: 'consume-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.permitConsumeAuthorized, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesConsumeWithoutConsuming();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeAuthority tests passed');
