import assert from 'node:assert/strict';

import { authorizeMemoryCacheAuditExportPermitConsumeApplication } from '../src/memoryCacheAuditExportPermitConsumeApplicationAuthority.js';
import type { MemoryCacheAuditExportPermitConsumeApplicationPreflight } from '../src/memoryCacheAuditExportPermitConsumeApplicationPreflight.js';

const preflight: MemoryCacheAuditExportPermitConsumeApplicationPreflight = {
  status: 'ready',
  consumeApplicationPreflightAllowed: true,
  permitConsumeAuthorized: true,
  permitIssued: true,
  permitConsumed: false,
  fileWriteAllowed: false,
  durablePersistenceAllowed: false,
  externalActionAllowed: false,
  permitId: 'permit:memory',
  consumeAuthorityId: 'consume-authority:memory',
  applicationRef: 'application:memory',
  operatorRef: 'operator:human',
  applicationPolicyRef: 'policy:application',
  format: 'jsonl',
  cacheRef: 'cache:live-aicos-memory',
  previewLines: ['{"event":"invalidate"}'],
  evidenceRefs: ['review-packets/BPK-124.md'],
  consumeApplication: {
    kind: 'memory_cache_audit_export_permit_consume_application_preflight',
    permitKind: 'memory_cache_audit_export',
    permitRef: 'permit:memory',
    authorityRef: 'consume-authority:memory',
    policyRef: 'policy:application',
  },
  blockers: [],
  reviewItems: [],
  nextActions: [],
};

function testReadyAuthorityAuthorizesApplicationWithoutEffects(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeApplication({
    preflight,
    applicationAuthorityId: 'application-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'ready');
  assert.equal(authority.consumeApplicationAuthorityAllowed, true);
  assert.equal(authority.consumeApplicationAuthorized, true);
  assert.equal(authority.permitConsumed, false);
  assert.equal(authority.fileWriteAllowed, false);
  assert.equal(authority.authorizedApplication.kind, 'memory_cache_audit_export_permit_consume_application_authority');
}

function testMissingAuthorityIdRequiresReview(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeApplication({
    preflight,
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'review_required');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.reviewItems.includes('memory_cache_audit_export_permit_consume_application_authority.application_authority_id_required'));
}

function testBlockedPreflightBlocksAuthority(): void {
  const authority = authorizeMemoryCacheAuditExportPermitConsumeApplication({
    preflight: { ...preflight, status: 'blocked', consumeApplicationPreflightAllowed: false, permitConsumeAuthorized: false, blockers: ['blocked'] },
    applicationAuthorityId: 'application-authority:memory',
    authorizedByRef: 'authority:operator',
    expiresAtRef: 'expiry:bounded-window',
  });

  assert.equal(authority.status, 'blocked');
  assert.equal(authority.consumeApplicationAuthorized, false);
  assert.ok(authority.blockers.includes('memory_cache_audit_export_permit_consume_application_authority.preflight_not_allowed'));
}

testReadyAuthorityAuthorizesApplicationWithoutEffects();
testMissingAuthorityIdRequiresReview();
testBlockedPreflightBlocksAuthority();

console.log('memoryCacheAuditExportPermitConsumeApplicationAuthority tests passed');
