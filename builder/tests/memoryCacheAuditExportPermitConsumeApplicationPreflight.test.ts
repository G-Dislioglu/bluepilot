import assert from 'node:assert/strict';

import { preflightMemoryCacheAuditExportPermitConsumeApplication } from '../src/memoryCacheAuditExportPermitConsumeApplicationPreflight.js';
import type { MemoryCacheAuditExportPermitConsumeAuthority } from '../src/memoryCacheAuditExportPermitConsumeAuthority.js';

const authority: MemoryCacheAuditExportPermitConsumeAuthority = {
  status: 'ready',
  permitConsumeAuthorityAllowed: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  consumeAuthorityId: 'consume-authority:memory',
  authorizedByRef: 'authority:operator',
  expiresAtRef: 'expiry:bounded-window',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-120.md'],
  authorizedConsume: {
    kind: 'memory_cache_audit_export_permit_consume_authority',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    preflightRef: 'consume:memory',
    policyRef: 'policy:consume',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyApplicationPreflightKeepsSideEffectsClosed(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeApplication({
    authority,
    applicationRef: 'application:memory',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'ready');
  assert.equal(preflight.consumeApplicationPreflightAllowed, true);
  assert.equal(preflight.permitConsumeAuthorized, true);
  assert.equal(preflight.permitConsumed, false);
  assert.equal(preflight.fileWriteAllowed, false);
  assert.equal(preflight.consumeApplication.kind, 'memory_cache_audit_export_permit_consume_application_preflight');
}

function testMissingApplicationRefRequiresReview(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeApplication({
    authority,
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'review_required');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.reviewItems.includes('memory_cache_audit_export_permit_consume_application_preflight.application_ref_required'));
}

function testBlockedAuthorityBlocksPreflight(): void {
  const preflight = preflightMemoryCacheAuditExportPermitConsumeApplication({
    authority: { ...authority, status: 'blocked', permitConsumeAuthorityAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    applicationRef: 'application:memory',
    operatorRef: 'operator:human',
    applicationPolicyRef: 'policy:application',
  });

  assert.equal(preflight.status, 'blocked');
  assert.equal(preflight.consumeApplicationPreflightAllowed, false);
  assert.ok(preflight.blockers.includes('memory_cache_audit_export_permit_consume_application_preflight.authority_not_allowed'));
}

testReadyApplicationPreflightKeepsSideEffectsClosed();
testMissingApplicationRefRequiresReview();
testBlockedAuthorityBlocksPreflight();

console.log('memoryCacheAuditExportPermitConsumeApplicationPreflight tests passed');
